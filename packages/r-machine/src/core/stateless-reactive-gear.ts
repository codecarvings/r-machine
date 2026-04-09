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

import type { CmdComposer } from "./cmd.js";
import type { StatelessGetterComposer } from "./getter.js";
import type { AnyReactiveResource, ReactiveGearFactory } from "./reactive-gear.js";
import type { RelayComposer } from "./relay.js";
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { NamespaceList, SurfaceList } from "./resource-list.js";
import type { NamespaceMap, SurfaceMap } from "./resource-map.js";

export interface StatelessReactiveMapPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly Gear: StatelessReactiveGearFactoryComposer;
  readonly VertexGear: StatelessReactiveGearFactoryComposer;
  use(): StatelessReactiveMapPlugPkg<RA, KA, NM>;
}

type StatelessReactiveMapPlugPkg<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: StatelessReactivePlugCtx<RA, KA>;
  readonly _: StatelessReactivePlugCursor;
} & SurfaceMap<RA, KA>;

export interface StatelessReactiveListPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly Gear: StatelessReactiveGearFactoryComposer;
  readonly VertexGear: StatelessReactiveGearFactoryComposer;
  use(): StatelessReactiveListPlugPkg<RA, KA, NL>;
}

type StatelessReactiveListPlugPkg<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...SurfaceList<RA, NL>, StatelessReactivePlugCtx<RA, KA>, StatelessReactivePlugCursor];

type StatelessReactivePlugCtx<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>> = keyof KA extends never
  ? {}
  : { readonly kit: SurfaceMap<RA, KA> };

interface StatelessReactivePlugCursor {
  readonly getter: StatelessGetterComposer;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type RejectAsyncValueProperties<R> = {
  readonly [K in keyof R]: R[K] extends (...args: any[]) => Promise<void>
    ? R[K]
    : R[K] extends (...args: any[]) => Promise<any>
      ? never
      : R[K];
};

export type StatelessReactiveGearFactoryComposer = <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
  factory: () => R | Promise<R>
) => ReactiveGearFactory<R>;
