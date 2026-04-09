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

type ReadableReactiveGearResource<S extends AnyState, G extends string> = { readonly [P in G]: DefaultGetter<S> };
type WritableReactiveGearResource<S extends AnyState, G extends string, A extends string> = {
  readonly [P in G]: DefaultGetter<S>;
} & {
  readonly [P in A]: DefaultAction<S>;
};

export interface StatefulReactiveGearMapComposer<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> {
  <const G extends string, const A extends string>(
    factory: (
      plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>,
      _: StatefulReactiveGearCursor<S>
    ) => readonly [G, A] | Promise<readonly [G, A]>
  ): ResourcePackage<WritableReactiveGearResource<S, G, A>, StatefulResourceMapPlug<RA, KA, NM, S>>;
  <const G extends string>(
    factory: (
      plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>,
      _: StatefulReactiveGearCursor<S>
    ) => readonly [G] | Promise<readonly [G]>
  ): ResourcePackage<ReadableReactiveGearResource<S, G>, StatefulResourceMapPlug<RA, KA, NM, S>>;

  <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
    factory: (plugin: StatefulReactiveGearMapPlugin<RA, KA, NM, S>, _: StatefulReactiveGearCursor<S>) => R | Promise<R>
  ): ResourcePackage<R, StatefulResourceMapPlug<RA, KA, NM, S>>;
}

export interface StatefulReactiveGearListComposer<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> {
  <const G extends string, const A extends string>(
    factory: (
      plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>,
      _: StatefulReactiveGearCursor<S>
    ) => readonly [G, A] | Promise<readonly [G, A]>
  ): ResourcePackage<WritableReactiveGearResource<S, G, A>, StatefulResourceListPlug<RA, KA, NL, S>>;
  <const G extends string>(
    factory: (
      plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>,
      _: StatefulReactiveGearCursor<S>
    ) => readonly [G] | Promise<readonly [G]>
  ): ResourcePackage<ReadableReactiveGearResource<S, G>, StatefulResourceListPlug<RA, KA, NL, S>>;

  <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
    factory: (plugin: StatefulReactiveGearListPlugin<RA, KA, NL, S>, _: StatefulReactiveGearCursor<S>) => R | Promise<R>
  ): ResourcePackage<R, StatefulResourceListPlug<RA, KA, NL, S>>;
}
