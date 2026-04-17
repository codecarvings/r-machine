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

import type { AnyLocale } from "#r-machine/locale";
import type { AnyResAtlas } from "./res-atlas.js";
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

const plugHeadSymbol = Symbol("plugHead");
const plugResolveSymbol = Symbol("plugResolve");
export interface PlugBody<PH extends AnyPlugHead> {
  readonly [plugHeadSymbol]: PH;
  [plugResolveSymbol]: () => ExtractPlugin<PH>;
}

export function getPlugHead<H extends AnyPlugHead>(plug: PlugBody<H>): H {
  return plug[plugHeadSymbol];
}

export function getPlugResolve<H extends AnyPlugHead>(plug: PlugBody<H>): () => ExtractPlugin<H> {
  return plug[plugResolveSymbol];
}
export function setPlugResolve<H extends AnyPlugHead>(plug: PlugBody<H>, resolve: () => ExtractPlugin<H>): void {
  plug[plugResolveSymbol] = resolve;
}
