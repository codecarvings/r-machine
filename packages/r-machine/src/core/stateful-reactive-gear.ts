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
import type { AnyResDomain } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

interface StatefulReactiveGearCursor<S extends AnyState> extends GearCursor {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
}

type StatefulReactiveGearCtx<RD extends AnyResDomain, KA extends NamespaceMap<RD>, S extends AnyState> = PluginCtx<
  RD,
  KA
> & {
  readonly state: S;
  readonly defaultState: S;
};

type StatefulReactiveGearMapPlugin<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  S extends AnyState,
> = MapPlugin<RD, NM, StatefulReactiveGearCtx<RD, KA, S>>;

type StatefulReactiveGearListPlugin<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  S extends AnyState,
> = ListPlugin<RD, NL, StatefulReactiveGearCtx<RD, KA, S>>;

interface StatefulReactiveGearMapPlugHead<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  CTX extends StatefulReactiveGearCtx<RD, KA, S>,
  S extends AnyState,
> extends ResMapPlugHead<"gear", RD, KA, NM, CTX> {
  readonly defaultState: S;
}

interface StatefulReactiveGearListPlugHead<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  CTX extends StatefulReactiveGearCtx<RD, KA, S>,
  S extends AnyState,
> extends ResListPlugHead<"gear", RD, KA, NL, CTX> {
  readonly defaultState: S;
}

interface StatefulReactiveGearMapPlug<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  S extends AnyState,
> extends PlugBody<StatefulReactiveGearMapPlugHead<RD, KA, NM, StatefulReactiveGearCtx<RD, KA, S>, S>> {}

interface StatefulReactiveGearListPlug<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  S extends AnyState,
> extends PlugBody<StatefulReactiveGearListPlugHead<RD, KA, NL, StatefulReactiveGearCtx<RD, KA, S>, S>> {}

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
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  S extends AnyState,
  T,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RD, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateReactiveGearResource<S, D> & T & ReactiveGearTag, StatefulReactiveGearMapPlug<RD, KA, NM, S>>;

  <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RD, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R & T & ReactiveGearTag, StatefulReactiveGearMapPlug<RD, KA, NM, S>>;
}

export interface StatefulReactiveGearListDefiner<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  S extends AnyState,
  T,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearListPlugin<RD, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateReactiveGearResource<S, D> & T & ReactiveGearTag, StatefulReactiveGearListPlug<RD, KA, NL, S>>;

  <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulReactiveGearListPlugin<RD, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R & T & ReactiveGearTag, StatefulReactiveGearListPlug<RD, KA, NL, S>>;
}
