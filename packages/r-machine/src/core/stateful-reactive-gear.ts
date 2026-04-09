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
import type { DefaultGetter, GetterComposer } from "./getter.js";
import type { ReactiveGearFactory } from "./reactive-gear.js";
import type { RelayComposer } from "./relay.js";
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { NamespaceList, SurfaceList } from "./resource-list.js";
import type { NamespaceMap, SurfaceMap } from "./resource-map.js";
import type { StatelessReactiveGearFactoryComposer } from "./stateless-reactive-gear.js";

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

export interface StatefulReactiveMapPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> {
  readonly Gear: StatefulReactiveGearFactoryComposer<S>;
  readonly VertexGear: StatefulReactiveGearFactoryComposer<S>;
  use(): StatefulReactiveMapPlugPkg<RA, KA, NM, S>;
}

type StatefulReactiveMapPlugPkg<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> = SurfaceMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: StatefulReactivePlugCtx<RA, KA, S>;
  readonly _: StatefulReactivePlugCursor<S>;
} & SurfaceMap<RA, KA>;

export interface StatefulReactiveListPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> {
  readonly Gear: StatefulReactiveGearFactoryComposer<S>;
  readonly VertexGear: StatefulReactiveGearFactoryComposer<S>;
  use(): StatefulReactiveListPlugPkg<RA, KA, NL, S>;
}

type StatefulReactiveListPlugPkg<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> = [...SurfaceList<RA, NL>, StatefulReactivePlugCtx<RA, KA, S>, StatefulReactivePlugCursor<S>];

type StatefulReactivePlugCtx<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, S extends AnyState> = {
  readonly state: S;
  readonly defaultState: S;
} & (keyof KA extends never ? {} : { readonly kit: SurfaceMap<RA, KA> });

interface StatefulReactivePlugCursor<S extends AnyState> {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type ReadableReactiveGearResource<S extends AnyState, G extends string> = { readonly [P in G]: DefaultGetter<S> };
type WritableReactiveGearResource<S extends AnyState, G extends string, A extends string> = {
  readonly [P in G]: DefaultGetter<S>;
} & {
  readonly [P in A]: DefaultAction<S>;
};

interface StatefulReactiveGearFactoryComposer<S extends AnyState> extends StatelessReactiveGearFactoryComposer {
  <const G extends string, const A extends string>(
    factory: () => readonly [G, A] | Promise<readonly [G, A]>
  ): ReactiveGearFactory<WritableReactiveGearResource<S, G, A>>;
  <const G extends string>(
    factory: () => readonly [G] | Promise<readonly [G]>
  ): ReactiveGearFactory<ReadableReactiveGearResource<S, G>>;
}
