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
import type { RelayComposer } from "./relay.js";
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { NamespaceList, SurfaceList } from "./resource-list.js";
import type { NamespaceMap, SurfaceMap } from "./resource-map.js";
import type { AnyResource } from "./resource-origin.js";

export interface PlainGearMapPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly Gear: PlainGearFactoryComposer;
  readonly VertexGear: PlainGearFactoryComposer;
  use(): PlainGearMapPlugPkg<RA, KA, NM>;
}

type PlainGearMapPlugPkg<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: PlainGearPlugCtx<RA, KA>;
  readonly _: PlainGearPlugCursor;
} & SurfaceMap<RA, KA>;

export interface PlainGearListPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly Gear: PlainGearFactoryComposer;
  readonly VertexGear: PlainGearFactoryComposer;
  use(): PlainGearListPlugPkg<RA, KA, NL>;
}

type PlainGearPlugCtx<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>> = {} & (keyof KA extends never
  ? {}
  : { readonly kit: SurfaceMap<RA, KA> });

interface PlainGearPlugCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

declare const plainGearFactoryBrand: unique symbol;
interface PlainGearFactoryBrand {
  readonly [plainGearFactoryBrand]: true;
}
type PlainGearFactory<R extends AnyResource> = (() => R) & PlainGearFactoryBrand;
export type AnyPlainGearFactory = PlainGearFactory<AnyResource>;
type PlainGearFactoryComposer = <R extends AnyResource>(factory: () => R | Promise<R>) => PlainGearFactory<R>;

type PlainGearListPlugPkg<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> = [
  ...SurfaceList<RA, NL>,
  PlainGearPlugCtx<RA, KA>,
  PlainGearPlugCursor,
];
