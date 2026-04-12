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

import type { ActionComposer, DefaultAction } from "./action.js";
import type { GearCursor } from "./gear.js";
import type { DefaultGetter, GetterComposer } from "./getter.js";
import type { PlugBody, PluginCtx, PlugMode } from "./plug.js";
import type { AnyReactiveRes, RejectAsyncValueProps } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList, SurfaceList } from "./res-list.js";
import type { NamespaceMap, SurfaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResPlugHead } from "./res-plug.js";

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

type StatefulReactiveGearCtx<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, S extends AnyState> = PluginCtx<
  RA,
  KA
> & {
  readonly state: S;
  readonly defaultState: S;
};

interface StatefulReactiveGearCursor<S extends AnyState> extends GearCursor {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
}

interface StatefulReactiveGearPlugHead<
  M extends PlugMode,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA> | NamespaceList<RA>,
  CTX extends StatefulReactiveGearCtx<RA, KA, S>,
  S extends AnyState,
> extends ResPlugHead<M, RA, KA, NM, CTX> {
  readonly defaultState: S;
}

interface StatefulReactiveGearMapPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> extends PlugBody<StatefulReactiveGearPlugHead<"map", RA, KA, NM, StatefulReactiveGearCtx<RA, KA, S>, S>> {}

type StatefulReactiveGearMapPlugin<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> = SurfaceMap<RA, Omit<NM, "$">> & {
  readonly $: StatefulReactiveGearCtx<RA, KA, S>;
} & SurfaceMap<RA, Omit<KA, keyof NM>>;

interface StatefulReactiveGearListPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> extends PlugBody<StatefulReactiveGearPlugHead<"list", RA, KA, NL, StatefulReactiveGearCtx<RA, KA, S>, S>> {}

type StatefulReactiveGearListPlugin<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> = [...SurfaceList<RA, NL>, StatefulReactiveGearCtx<RA, KA, S>];

type ReadableReactiveGearResource<S extends AnyState, G extends string> = { [P in G]: DefaultGetter<S> };
type WritableReactiveGearResource<S extends AnyState, G extends string, A extends string> = {
  [P in G]: DefaultGetter<S>;
} & {
  [P in A]: DefaultAction<S>;
};

type ReadonlyStateDef = readonly [string];
type WritableStateDef = readonly [string, string];
type StateDef = ReadonlyStateDef | WritableStateDef;

type StateReactiveGearResource<S extends AnyState, D extends StateDef> = D extends readonly [
  infer G extends string,
  infer A extends string,
]
  ? WritableReactiveGearResource<S, G, A>
  : D extends readonly [infer G extends string]
    ? ReadableReactiveGearResource<S, G>
    : never;

export interface StatefulReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateReactiveGearResource<S, D>, StatefulReactiveGearMapPlug<RA, KA, NM, S>>;

  <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R, StatefulReactiveGearMapPlug<RA, KA, NM, S>>;
}

export interface StatefulReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateReactiveGearResource<S, D>, StatefulReactiveGearListPlug<RA, KA, NL, S>>;

  <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R, StatefulReactiveGearListPlug<RA, KA, NL, S>>;
}
