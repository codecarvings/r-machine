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
export type ExtractPlugin<T extends AnyPlugHead | PlugBody<AnyPlugHead>> =
  T extends PlugBody<infer PH extends AnyPlugHead>
    ? ExtractPlugin<PH>
    : T extends AnyMapPlugHead
      ? MapPlugin<T[typeof resAtlas], T["deps"], T[typeof ctx]>
      : T extends AnyListPlugHead
        ? ListPlugin<T[typeof resAtlas], T["deps"], T[typeof ctx]>
        : never;

export type PlugResolve<PH extends AnyPlugHead> = (
  locale: AnyLocale | undefined,
  chain: readonly AnyNamespace[]
) => Promise<ExtractPlugin<PH>>;

// Minimal capability the owning RMachine exposes back through a Plug. Kept
// deliberately narrow (no import of the lib-side RMachine into core, and no
// wide surface leaking onto the consumer Plug): the only thing reachable from
// a Plug is the ability to drop all resolved resource state for its machine —
// the seam `@r-machine/testing` uses to isolate tests (`disposeResources`).
export interface PlugMachine {
  disposeResources(): void;
}

const plugHeadSymbol = Symbol("plugHead");
const plugResolveSymbol = Symbol("plugResolve");
const plugIdSymbol = Symbol("plugId");
const plugMachineSymbol = Symbol("plugMachine");
export interface PlugBody<PH extends AnyPlugHead> {
  readonly [plugHeadSymbol]: PH;
  [plugResolveSymbol]: PlugResolve<PH>;
  // Stable identity for the lifetime of this Plug instance. Used by the
  // React adapter to key per-Plug request-scoped wireCaches (so server SSR
  // of client components doesn't reuse a wire whose plugin was disposed at
  // the previous request's end). A unique Symbol per createPlug call —
  // module HMR creates a new Plug with a new id; the prior id becomes
  // unreachable and any scope-bound caches keyed by it are GC'd.
  readonly [plugIdSymbol]: symbol;
  // Back-reference to the owning RMachine's reset capability, stamped by
  // `createResMatrix` when the connector carries one. Absent on plugs built
  // outside an RMachine (e.g. bare composer unit tests).
  [plugMachineSymbol]?: PlugMachine;
}

const defaultPlugResolve: PlugResolve<any> = () => {
  throw new RMachineResolveError(ERR_RESOLVE_FAILED, "Plug resolve not set.");
};
export function createPlug<H extends AnyPlugHead>(head: H): PlugBody<H> {
  // Workaround for HMR warnings (export not being a React component)
  function Plug() {}
  Plug.displayName = "RMachinePlug";
  (Plug as any)[plugHeadSymbol] = head;
  (Plug as any)[plugResolveSymbol] = defaultPlugResolve as PlugResolve<H>;
  (Plug as any)[plugIdSymbol] = Symbol("plug");
  return Plug as unknown as PlugBody<H>;
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

export function getPlugId(plug: PlugBody<AnyPlugHead>): symbol {
  return plug[plugIdSymbol];
}

export function setPlugMachine(plug: PlugBody<AnyPlugHead>, machine: PlugMachine): void {
  plug[plugMachineSymbol] = machine;
}
export function getPlugMachine(plug: PlugBody<AnyPlugHead>): PlugMachine | undefined {
  return plug[plugMachineSymbol];
}

interface MapPlugOutline<RA extends AnyResAtlas> {
  mode: "map";
  deps: HandleMap<RA>;
}
interface ListPlugOutline<RA extends AnyResAtlas> {
  mode: "list";
  deps: HandleList<RA>;
}

const emptyMap = {};
export function getPlugOutline<RA extends AnyResAtlas>(...args: unknown[]): MapPlugOutline<RA> | ListPlugOutline<RA> {
  if (args.length === 0) {
    return {
      mode: "map",
      deps: emptyMap as HandleMap<RA>,
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
