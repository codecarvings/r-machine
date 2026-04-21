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

import type { AnyResAtlas } from "#r-machine/core";
import { ERR_PLUG_RESOLVE_NOT_SET, RMachineResolveError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import { isNamespace } from "./res-domain.js";
import type { NamespaceList, SurfaceList } from "./res-list.js";
import type { NamespaceMap, SurfaceMap } from "./res-map.js";

export type PlugArea = "res" | "gate";
export type PlugMode = "map" | "list";

export type PluginCtx<RA extends AnyResAtlas, KA extends NamespaceMap<RA>> = {} & (keyof KA extends never
  ? {}
  : { readonly kit: SurfaceMap<RA, KA> });

export type LocaleAwarePluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = PluginCtx<
  RA,
  KA
> & {
  readonly locale: L;
};

export type MapPlugin<RA extends AnyResAtlas, NM extends NamespaceMap<RA>, CTX> = SurfaceMap<RA, Omit<NM, "$">> & {
  $: CTX;
} & (CTX extends { readonly kit: infer KA } ? Omit<KA, keyof NM> : {});

export type ListPlugin<RA extends AnyResAtlas, NL extends NamespaceList<RA>, CTX> = [...SurfaceList<RA, NL>, CTX];

declare const resAtlas: unique symbol;
declare const kit: unique symbol;
declare const ctx: unique symbol;
interface BasePlugHead<
  A extends PlugArea,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  CTX extends PluginCtx<RA, KA>,
> {
  readonly area: A;
  readonly [resAtlas]: RA;
  readonly [kit]: KA;
  readonly [ctx]: CTX;
}

export interface MapPlugHead<
  A extends PlugArea,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  CTX extends PluginCtx<RA, KA>,
> extends BasePlugHead<A, RA, KA, CTX> {
  readonly mode: "map";
  readonly namespaces: NM;
}
export type AnyMapPlugHead = MapPlugHead<any, any, any, any, any>;

export interface ListPlugHead<
  A extends PlugArea,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  CTX extends PluginCtx<RA, KA>,
> extends BasePlugHead<A, RA, KA, CTX> {
  readonly mode: "list";
  readonly namespaces: NL;
}
export type AnyListPlugHead = ListPlugHead<any, any, any, any, any>;

export type AnyPlugHead = AnyMapPlugHead | AnyListPlugHead;

export type ExtractResAtlas<PH extends AnyPlugHead> = PH[typeof resAtlas];
export type ExtractKit<PH extends AnyPlugHead> = PH[typeof kit];
export type ExtractCtx<PH extends AnyPlugHead> = PH[typeof ctx];
export type ExtractPlugin<PH extends AnyPlugHead> = PH extends AnyMapPlugHead
  ? MapPlugin<PH[typeof resAtlas], PH["namespaces"], PH[typeof ctx]>
  : PH extends AnyListPlugHead
    ? ListPlugin<PH[typeof resAtlas], PH["namespaces"], PH[typeof ctx]>
    : never;

type PlugLocale<PH extends AnyPlugHead> = PH extends { readonly locale: infer L } ? L : undefined;

const plugHeadSymbol = Symbol("plugHead");
const plugLocaleSymbol = Symbol("plugLocale");
const plugResolveSymbol = Symbol("plugResolve");
export interface PlugBody<PH extends AnyPlugHead> {
  readonly [plugHeadSymbol]: PH;
  [plugLocaleSymbol]: PlugLocale<PH>;
  [plugResolveSymbol]: () => ExtractPlugin<PH>;
}

const defaultPlugResolve = () => {
  throw new RMachineResolveError(ERR_PLUG_RESOLVE_NOT_SET, "Plug resolve not set.");
};
export function createPlug<H extends AnyPlugHead>(head: H): PlugBody<H> {
  return {
    [plugHeadSymbol]: head,
    [plugLocaleSymbol]: undefined as PlugLocale<H>,
    [plugResolveSymbol]: defaultPlugResolve as () => ExtractPlugin<H>,
  };
}

export function getPlugHead<H extends AnyPlugHead>(plug: PlugBody<H>): H {
  return plug[plugHeadSymbol];
}

export function getPlugLocale<H extends AnyPlugHead>(plug: PlugBody<H>): PlugLocale<H> {
  return plug[plugLocaleSymbol];
}
export function setPlugLocale<H extends AnyPlugHead>(plug: PlugBody<H>, locale: PlugLocale<H>): void {
  plug[plugLocaleSymbol] = locale;
}

export function getPlugResolve<H extends AnyPlugHead>(plug: PlugBody<H>): () => ExtractPlugin<H> {
  return plug[plugResolveSymbol];
}
export function setPlugResolve<H extends AnyPlugHead>(plug: PlugBody<H>, resolve: () => ExtractPlugin<H>): void {
  plug[plugResolveSymbol] = resolve;
}

interface MapPlugOutline<RA extends AnyResAtlas> {
  mode: "map";
  namespaces: NamespaceMap<RA>;
}
interface ListPlugOutline<RA extends AnyResAtlas> {
  mode: "list";
  namespaces: NamespaceList<RA>;
}

export function getPlugOutline<RA extends AnyResAtlas>(...args: unknown[]): MapPlugOutline<RA> | ListPlugOutline<RA> {
  if (args.length === 0) {
    return {
      mode: "map",
      namespaces: {} as NamespaceMap<RA>,
    };
  }
  if (args.length === 1 && !isNamespace(args[0])) {
    return {
      mode: "map",
      namespaces: args[0] as NamespaceMap<RA>,
    };
  }
  return {
    mode: "list",
    namespaces: args as NamespaceList<RA>,
  };
}
