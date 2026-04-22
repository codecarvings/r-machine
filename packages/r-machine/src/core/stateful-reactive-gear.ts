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
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { ReactiveGearTag } from "./reactive-gear.js";
import type { AnyReactiveRes, RejectAsyncValueProps } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import { getNamespaceList, type HandleList } from "./res-list.js";
import { getNamespaceMap, type HandleMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

interface StatefulReactiveGearCursor<S extends AnyState> extends GearCursor {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
}

export type StatefulReactiveGearCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>, S extends AnyState> = PluginCtx<
  RA,
  KM
> & {
  readonly state: S;
  readonly defaultState: S;
};

type StatefulReactiveGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> = MapPlugin<RA, DM, StatefulReactiveGearCtx<RA, KM, S>>;

type StatefulReactiveGearListPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> = ListPlugin<RA, DL, StatefulReactiveGearCtx<RA, KM, S>>;

interface StatefulReactiveGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends StatefulReactiveGearCtx<RA, KM, S>,
  S extends AnyState,
> extends ResMapPlugHead<"gear", RA, KM, DM, CTX> {
  readonly defaultState: S;
}

export function createStatefulReactiveGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends StatefulReactiveGearCtx<RA, KM, S>,
  S extends AnyState,
>(deps: DM, defaultState: S): StatefulReactiveGearMapPlugHead<RA, KM, DM, CTX, S> {
  const namespaces = getNamespaceMap(deps);
  return {
    area: "res",
    mode: "map",
    family: "gear",
    deps,
    namespaces,
    defaultState,
  } as unknown as StatefulReactiveGearMapPlugHead<RA, KM, DM, CTX, S>;
}

interface StatefulReactiveGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends StatefulReactiveGearCtx<RA, KM, S>,
  S extends AnyState,
> extends ResListPlugHead<"gear", RA, KM, DL, CTX> {
  readonly defaultState: S;
}

export function createStatefulReactiveGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends StatefulReactiveGearCtx<RA, KM, S>,
  S extends AnyState,
>(deps: DL, defaultState: S): StatefulReactiveGearListPlugHead<RA, KM, DL, CTX, S> {
  const namespaces = getNamespaceList(deps);
  return {
    area: "res",
    mode: "list",
    family: "gear",
    deps,
    namespaces,
    defaultState,
  } as unknown as StatefulReactiveGearListPlugHead<RA, KM, DL, CTX, S>;
}

interface StatefulReactiveGearMapPlug<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> extends PlugBody<StatefulReactiveGearMapPlugHead<RA, KM, DM, StatefulReactiveGearCtx<RA, KM, S>, S>> {}

interface StatefulReactiveGearListPlug<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> extends PlugBody<StatefulReactiveGearListPlugHead<RA, KM, DL, StatefulReactiveGearCtx<RA, KM, S>, S>> {}

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

export interface StatefulReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KM, DM, S>, _: StatefulReactiveGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateReactiveGearResource<S, D> & ReactiveGearTag, StatefulReactiveGearMapPlug<RA, KM, DM, S>>;

  <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KM, DM, S>, _: StatefulReactiveGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R & ReactiveGearTag, StatefulReactiveGearMapPlug<RA, KM, DM, S>>;
}

export interface StatefulReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KM, DL, S>, _: StatefulReactiveGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateReactiveGearResource<S, D> & ReactiveGearTag, StatefulReactiveGearListPlug<RA, KM, DL, S>>;

  <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KM, DL, S>, _: StatefulReactiveGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R & ReactiveGearTag, StatefulReactiveGearListPlug<RA, KM, DL, S>>;
}
