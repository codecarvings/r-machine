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
import type { AnyNamespace, AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
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

declare const resAtlas: unique symbol;
declare const ctx: unique symbol;
export interface PlugHead<
  A extends PlugArea,
  M extends PlugMode,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  CTX extends PluginCtx<RA, KA>,
> {
  readonly area: A;
  readonly mode: M;
  readonly kit: KA;
  readonly namespaces: NS;
  readonly deps: AnyNamespace[];
  readonly [resAtlas]: RA;
  readonly [ctx]: CTX;
}
export type AnyPlugHead = PlugHead<any, any, any, any, any, any>;
export type AnyMapPlugHead = PlugHead<any, "map", any, any, any, any>;
export type AnyListPlugHead = PlugHead<any, "list", any, any, any, any>;

export type ExtractResAtlas<PH extends AnyPlugHead> = PH[typeof resAtlas];
export type ExtractCtx<PH extends AnyPlugHead> = PH[typeof ctx];

interface PlugMapData<PH extends AnyMapPlugHead> {
  readonly $: PH[typeof ctx];
  readonly map: SurfaceMap<PH[typeof resAtlas], Omit<PH["namespaces"], "$">>;
}

type TupleToObject<T extends readonly unknown[]> = {
  [K in keyof T as K extends `${number}` ? K : never]: T[K];
};

interface PlugListData<PH extends AnyListPlugHead> {
  readonly $: PH[typeof ctx];
  readonly list: SurfaceMap<
    PH[typeof resAtlas],
    Omit<TupleToObject<PH["namespaces"] extends readonly unknown[] ? PH["namespaces"] : never>, "$">
  >;
}

type PlugData<PH extends AnyPlugHead> = PH["mode"] extends "map"
  ? PlugMapData<PH>
  : PH["mode"] extends "list"
    ? PlugListData<PH>
    : never;

const plugHeadSymbol = Symbol("plugHead");
const plugResolveSymbol = Symbol("plugResolve");
export interface PlugBody<PH extends AnyPlugHead> {
  readonly [plugHeadSymbol]: PH;
  [plugResolveSymbol]: () => PlugData<PH>;
}

export type AnyPlugBody = PlugBody<AnyPlugHead>;

export function getPlugHead<H extends AnyPlugHead>(plug: PlugBody<H>): H {
  return plug[plugHeadSymbol];
}

export function getPlugResolve<H extends AnyPlugHead>(plug: PlugBody<H>): () => PlugData<H> {
  return plug[plugResolveSymbol];
}
export function setPlugResolve<H extends AnyPlugHead>(plug: PlugBody<H>, resolve: () => PlugData<H>): void {
  plug[plugResolveSymbol] = resolve;
}
