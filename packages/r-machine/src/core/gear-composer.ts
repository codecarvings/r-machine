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

import type { GearListDefiner, GearMapDefiner, GearTag } from "./gear.js";
import type { ReactiveGearListDepsComposer, ReactiveGearMapDepsComposer } from "./reactive-gear-composer.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { GearNamespaceList, NamespaceList } from "./res-list.js";
import type { GearNamespaceMap, NamespaceMap } from "./res-map.js";
import type { VertexGearTag } from "./vertex-gear.js";

export interface GearComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  T extends GearTag | VertexGearTag = GearTag,
> {
  readonly deps: GearDepsComposer<RA, KA, T>;
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, {}, T>;
  readonly define: GearMapDefiner<RA, KA, {}, T>;
}

interface GearDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, T extends GearTag | VertexGearTag> {
  (): GearMapDepsComposer<RA, KA, {}, T>;
  <NL extends GearNamespaceList<RA>>(...namespaces: NL): GearListDepsComposer<RA, KA, NL, T>;
  <NM extends GearNamespaceMap<RA>>(namespaces: NM): GearMapDepsComposer<RA, KA, NM, T>;
}

interface GearMapDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  T extends GearTag | VertexGearTag,
> {
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, NM, T>;
  readonly define: GearMapDefiner<RA, KA, NM, T>;
}

interface GearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  T extends GearTag | VertexGearTag,
> {
  readonly reactive: ReactiveGearListDepsComposer<RA, KA, NL, T>;
  readonly define: GearListDefiner<RA, KA, NL, T>;
}
