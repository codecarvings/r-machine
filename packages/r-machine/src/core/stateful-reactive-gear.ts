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

import type { NamespaceList } from "../lib/r-kit.js";
import type { ActionComposer, DefaultAction } from "./action.js";
import type { GearCtx, GearCursor } from "./gear.js";
import type { DefaultGetter, GetterComposer } from "./getter.js";
import type { AnyReactiveResource, RejectAsyncValueProperties } from "./reactive-resource.js";
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { SurfaceList } from "./resource-list.js";
import type { NamespaceMap, SurfaceMap } from "./resource-map.js";
import type { ResourcePackage } from "./resource-package.js";
import type { AnyState, StatefulResourceListPlug, StatefulResourceMapPlug } from "./resource-plug.js";

type StatefulReactiveGearCtx<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, S extends AnyState> = GearCtx<
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

type StatefulReactiveGearMapPlugin<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> = SurfaceMap<RA, Omit<NM, "$" | keyof KA>> & {
  readonly $: StatefulReactiveGearCtx<RA, KA, S>;
} & SurfaceMap<RA, KA>;

type StatefulReactiveGearListPlugin<
  RA extends AnyResourceAtlas,
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
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => D
  ): ResourcePackage<StateReactiveGearResource<S, D>, StatefulResourceMapPlug<RA, KA, NM, S>, false>;
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => Promise<D>
  ): ResourcePackage<StateReactiveGearResource<S, D>, StatefulResourceMapPlug<RA, KA, NM, S>, true>;

  <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => R
  ): ResourcePackage<R, StatefulResourceMapPlug<RA, KA, NM, S>, false>;
  <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => Promise<R>
  ): ResourcePackage<R, StatefulResourceMapPlug<RA, KA, NM, S>, true>;
}

export interface StatefulReactiveGearListComposer<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => D
  ): ResourcePackage<StateReactiveGearResource<S, D>, StatefulResourceListPlug<RA, KA, NL, S>, false>;
  <const D extends StateDef>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => Promise<D>
  ): ResourcePackage<StateReactiveGearResource<S, D>, StatefulResourceListPlug<RA, KA, NL, S>, true>;

  <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => R
  ): ResourcePackage<R, StatefulResourceListPlug<RA, KA, NL, S>, false>;
  <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => Promise<R>
  ): ResourcePackage<R, StatefulResourceListPlug<RA, KA, NL, S>, true>;
}
