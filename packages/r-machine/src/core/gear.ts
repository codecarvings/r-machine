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
import type { CmdComposer } from "./cmd.js";
import type { RelayComposer } from "./relay.js";
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { SurfaceList } from "./resource-list.js";
import type { NamespaceMap, SurfaceMap } from "./resource-map.js";
import type { AnyResource } from "./resource-origin.js";
import type { IsAsyncResourceFactory, ResourceFactoryOutcome, ResourcePackage } from "./resource-package.js";
import type { ResourceListPlug, ResourceMapPlug } from "./resource-plug.js";

export type GearCtx<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>> = {} & (keyof KA extends never
  ? {}
  : { readonly kit: SurfaceMap<RA, KA> });

export interface GearCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

export type GearMapPlugin<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$" | keyof KA>> & {
  readonly $: GearCtx<RA, KA>;
} & SurfaceMap<RA, KA>;

export type GearListPlugin<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> = [
  ...SurfaceList<RA, NL>,
  GearCtx<RA, KA>,
];

export type GearMapComposer<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> = <
  const RO extends ResourceFactoryOutcome<AnyResource>,
>(
  factory: (plugin: GearMapPlugin<RA, KA, NM>, _: GearCursor) => RO
) => ResourcePackage<Awaited<RO>, IsAsyncResourceFactory<RO>, ResourceMapPlug<RA, KA, NM>>;

export type GearListComposer<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> = <
  const RO extends ResourceFactoryOutcome<AnyResource>,
>(
  factory: (plugin: GearListPlugin<RA, KA, NL>, _: GearCursor) => RO
) => ResourcePackage<Awaited<RO>, IsAsyncResourceFactory<RO>, ResourceListPlug<RA, KA, NL>>;
