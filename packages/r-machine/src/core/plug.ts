/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import { ERR_RESOLVE_FAILED, RMachineResolveError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyResAtlas } from "./res-atlas.js";
import { type AnyNamespace, isHandle } from "./res-domain.js";
import type { AnyNamespaceList, HandleList, SurfaceList } from "./res-list.js";
import type { AnyNamespaceMap, HandleMap, SurfaceMap } from "./res-map.js";

export type PlugRealm = "res" | "gate";
export type PlugMode = "map" | "list";

export type PluginCtxAugmenter = ($: any) => void;

export type PluginCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>> = {} & (keyof KM extends never
  ? {}
  : { readonly kit: SurfaceMap<RA, KM> });

export type LocaleAwarePluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KM extends HandleMap<RA>> = PluginCtx<
  RA,
  KM
> & {
  readonly locale: L;
};

export type MapPlugin<RA extends AnyResAtlas, DM extends HandleMap<RA>, CTX> = SurfaceMap<RA, Omit<DM, "$">> & {
  $: CTX;
} & (CTX extends { readonly kit: infer KM } ? Omit<KM, keyof DM> : {});

export type ListPlugin<RA extends AnyResAtlas, DL extends HandleList<RA>, CTX> = [...SurfaceList<RA, DL>, CTX];

declare const resAtlas: unique symbol;
declare const kit: unique symbol;
declare const ctx: unique symbol;
interface BasePlugHead<
  R extends PlugRealm,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  CTX extends PluginCtx<RA, KM>,
> {
  readonly realm: R;
  readonly nsDepList: AnyNamespaceList;
  readonly [resAtlas]: RA;
  readonly [kit]: KM;
  readonly [ctx]: CTX;
}

export interface MapPlugHead<
  R extends PlugRealm,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends PluginCtx<RA, KM>,
> extends BasePlugHead<R, RA, KM, CTX> {
  readonly mode: "map";
  readonly deps: DM;
  readonly nsDeps: AnyNamespaceMap;
}
export type AnyMapPlugHead = MapPlugHead<any, any, any, any, any>;

export interface ListPlugHead<
  R extends PlugRealm,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends PluginCtx<RA, KM>,
> extends BasePlugHead<R, RA, KM, CTX> {
  readonly mode: "list";
  readonly deps: DL;
  readonly nsDeps: AnyNamespaceList;
}
export type AnyListPlugHead = ListPlugHead<any, any, any, any, any>;

export type AnyPlugHead = AnyMapPlugHead | AnyListPlugHead;

export type ExtractResAtlas<PH extends AnyPlugHead> = PH[typeof resAtlas];
export type ExtractKit<PH extends AnyPlugHead> = PH[typeof kit];
export type ExtractCtx<PH extends AnyPlugHead> = PH[typeof ctx];
export type ExtractPlugin<PH extends AnyPlugHead> = PH extends AnyMapPlugHead
  ? MapPlugin<PH[typeof resAtlas], PH["deps"], PH[typeof ctx]>
  : PH extends AnyListPlugHead
    ? ListPlugin<PH[typeof resAtlas], PH["deps"], PH[typeof ctx]>
    : never;

export type PlugResolve<PH extends AnyPlugHead> = (
  locale: AnyLocale | undefined,
  selfNamespace: AnyNamespace | undefined,
  chain: readonly AnyNamespace[]
) => Promise<ExtractPlugin<PH>>;

const plugHeadSymbol = Symbol("plugHead");
const plugResolveSymbol = Symbol("plugResolve");
export interface PlugBody<PH extends AnyPlugHead> {
  readonly [plugHeadSymbol]: PH;
  [plugResolveSymbol]: PlugResolve<PH>;
}

const defaultPlugResolve: PlugResolve<any> = () => {
  throw new RMachineResolveError(ERR_RESOLVE_FAILED, "Plug resolve not set.");
};
export function createPlug<H extends AnyPlugHead>(head: H): PlugBody<H> {
  return {
    [plugHeadSymbol]: head,
    [plugResolveSymbol]: defaultPlugResolve as PlugResolve<H>,
  };
}

export function getPlugHead<H extends AnyPlugHead>(plug: PlugBody<H>): H {
  return plug[plugHeadSymbol];
}

export function getPlugResolve<H extends AnyPlugHead>(plug: PlugBody<H>): PlugResolve<H> {
  return plug[plugResolveSymbol];
}
export function setPlugResolve<H extends AnyPlugHead>(plug: PlugBody<H>, resolve: PlugResolve<H>): void {
  plug[plugResolveSymbol] = resolve;
}

interface MapPlugOutline<RA extends AnyResAtlas> {
  mode: "map";
  deps: HandleMap<RA>;
}
interface ListPlugOutline<RA extends AnyResAtlas> {
  mode: "list";
  deps: HandleList<RA>;
}

export function getPlugOutline<RA extends AnyResAtlas>(...args: unknown[]): MapPlugOutline<RA> | ListPlugOutline<RA> {
  if (args.length === 0) {
    return {
      mode: "map",
      deps: {} as HandleMap<RA>,
    };
  }
  if (args.length === 1 && !isHandle(args[0])) {
    return {
      mode: "map",
      deps: args[0] as HandleMap<RA>,
    };
  }
  return {
    mode: "list",
    deps: args as HandleList<RA>,
  };
}
