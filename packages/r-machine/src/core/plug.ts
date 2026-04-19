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
import type { AnyResDomain } from "./res-domain.js";
import type { NamespaceList, SurfaceList } from "./res-list.js";
import type { NamespaceMap, SurfaceMap } from "./res-map.js";

export type PlugArea = "res" | "gate";
export type PlugMode = "map" | "list";

export type PluginCtx<RD extends AnyResDomain, KA extends NamespaceMap<RD>> = {} & (keyof KA extends never
  ? {}
  : { readonly kit: SurfaceMap<RD, KA> });

export type LocaleAwarePluginCtx<RD extends AnyResDomain, L extends AnyLocale, KA extends NamespaceMap<RD>> = PluginCtx<
  RD,
  KA
> & {
  readonly locale: L;
};

export type MapPlugin<RD extends AnyResDomain, NM extends NamespaceMap<RD>, CTX> = SurfaceMap<RD, Omit<NM, "$">> & {
  $: CTX;
} & (CTX extends { readonly kit: infer KA } ? Omit<KA, keyof NM> : {});

export type ListPlugin<RD extends AnyResDomain, NL extends NamespaceList<RD>, CTX> = [...SurfaceList<RD, NL>, CTX];

declare const resDomain: unique symbol;
declare const kit: unique symbol;
declare const ctx: unique symbol;
interface BasePlugHead<
  A extends PlugArea,
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  CTX extends PluginCtx<RD, KA>,
> {
  readonly area: A;
  readonly [resDomain]: RD;
  readonly [kit]: KA;
  readonly [ctx]: CTX;
}

export interface MapPlugHead<
  A extends PlugArea,
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  CTX extends PluginCtx<RD, KA>,
> extends BasePlugHead<A, RD, KA, CTX> {
  readonly mode: "map";
  readonly namespaces: NM;
}
export type AnyMapPlugHead = MapPlugHead<any, any, any, any, any>;

export interface ListPlugHead<
  A extends PlugArea,
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  CTX extends PluginCtx<RD, KA>,
> extends BasePlugHead<A, RD, KA, CTX> {
  readonly mode: "list";
  readonly namespaces: NL;
}
export type AnyListPlugHead = ListPlugHead<any, any, any, any, any>;

export type AnyPlugHead = AnyMapPlugHead | AnyListPlugHead;

export type ExtractResDomain<PH extends AnyPlugHead> = PH[typeof resDomain];
export type ExtractKit<PH extends AnyPlugHead> = PH[typeof kit];
export type ExtractCtx<PH extends AnyPlugHead> = PH[typeof ctx];
export type ExtractPlugin<PH extends AnyPlugHead> = PH extends AnyMapPlugHead
  ? MapPlugin<PH[typeof resDomain], PH["namespaces"], PH[typeof ctx]>
  : PH extends AnyListPlugHead
    ? ListPlugin<PH[typeof resDomain], PH["namespaces"], PH[typeof ctx]>
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

export function createPlug<H extends AnyPlugHead>(head: H): PlugBody<H> {
  return {
    [plugHeadSymbol]: head,
    [plugLocaleSymbol]: undefined as PlugLocale<H>,
    [plugResolveSymbol]: (() => {
      throw new Error("Plug resolve not set");
    }) as () => ExtractPlugin<H>,
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
