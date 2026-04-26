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
import type { CmdComposer } from "./cmd.js";
import {
  createGearListPlugHead,
  createGearMapPlugHead,
  type GearListPlugHead,
  type GearMapPlugHead,
} from "./gear-plug.js";
import type { DefaultGetter, GetterComposer } from "./getter.js";
import type { AnyOuterGear, RejectAsyncValueProps } from "./outer-gear.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { RelayComposer } from "./relay.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

export interface StatefulOuterGearCursor<S extends AnyState> {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

export type StatefulOuterGearCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>, S extends AnyState> = PluginCtx<
  RA,
  KM
> & {
  readonly state: S;
  readonly defaultState: S;
};

type StatefulOuterGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> = MapPlugin<RA, DM, StatefulOuterGearCtx<RA, KM, S>>;

type StatefulOuterGearListPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> = ListPlugin<RA, DL, StatefulOuterGearCtx<RA, KM, S>>;

interface StatefulOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends StatefulOuterGearCtx<RA, KM, S>,
  S extends AnyState,
> extends GearMapPlugHead<"outer", RA, KM, DM, CTX> {
  readonly defaultState: S;
}

export function createStatefulOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends StatefulOuterGearCtx<RA, KM, S>,
  S extends AnyState,
>(deps: DM, defaultState: S): StatefulOuterGearMapPlugHead<RA, KM, DM, CTX, S> {
  return {
    ...createGearMapPlugHead<"outer", RA, KM, DM, CTX>("outer", deps),
    defaultState,
  } as unknown as StatefulOuterGearMapPlugHead<RA, KM, DM, CTX, S>;
}

interface StatefulOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends StatefulOuterGearCtx<RA, KM, S>,
  S extends AnyState,
> extends GearListPlugHead<"outer", RA, KM, DL, CTX> {
  readonly defaultState: S;
}

export function createStatefulOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends StatefulOuterGearCtx<RA, KM, S>,
  S extends AnyState,
>(deps: DL, defaultState: S): StatefulOuterGearListPlugHead<RA, KM, DL, CTX, S> {
  return {
    ...createGearListPlugHead<"outer", RA, KM, DL, CTX>("outer", deps),
    defaultState,
  } as unknown as StatefulOuterGearListPlugHead<RA, KM, DL, CTX, S>;
}

interface StatefulOuterGearMapPlug<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> extends PlugBody<StatefulOuterGearMapPlugHead<RA, KM, DM, StatefulOuterGearCtx<RA, KM, S>, S>> {}

interface StatefulOuterGearListPlug<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> extends PlugBody<StatefulOuterGearListPlugHead<RA, KM, DL, StatefulOuterGearCtx<RA, KM, S>, S>> {}

type ReadableOuterGearResource<S extends AnyState, G extends string> = { [P in G]: DefaultGetter<S> };
type WritableOuterGearResource<S extends AnyState, G extends string, A extends string> = {
  [P in G]: DefaultGetter<S>;
} & {
  [P in A]: DefaultAction<S>;
};

type ReadonlyStateDef = readonly [string];
type WritableStateDef = readonly [string, string];
type StateDef = ReadonlyStateDef | WritableStateDef;

type StateOuterGearResource<S extends AnyState, D extends StateDef> = D extends readonly [
  infer G extends string,
  infer A extends string,
]
  ? WritableOuterGearResource<S, G, A>
  : D extends readonly [infer G extends string]
    ? ReadableOuterGearResource<S, G>
    : never;

export interface StatefulOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulOuterGearMapPlugin<RA, KM, DM, S>, _: StatefulOuterGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateOuterGearResource<S, D>, StatefulOuterGearMapPlug<RA, KM, DM, S>>;

  <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulOuterGearMapPlugin<RA, KM, DM, S>, _: StatefulOuterGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R, StatefulOuterGearMapPlug<RA, KM, DM, S>>;
}

export interface StatefulOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulOuterGearListPlugin<RA, KM, DL, S>, _: StatefulOuterGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateOuterGearResource<S, D>, StatefulOuterGearListPlug<RA, KM, DL, S>>;

  <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulOuterGearListPlugin<RA, KM, DL, S>, _: StatefulOuterGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R, StatefulOuterGearListPlug<RA, KM, DL, S>>;
}
