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

import type { GearListDefiner, GearMapDefiner } from "./gear.js";
import type { ReactiveGearListDepsComposer, ReactiveGearMapDepsComposer } from "./reactive-gear-composer.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";

export interface GearComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>> {
  readonly deps: GearDepsComposer<RA, KA>;
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, {}>;
  readonly define: GearMapDefiner<RA, KA, {}>;
}

interface GearDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>> {
  (): GearMapDepsComposer<RA, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): GearListDepsComposer<RA, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): GearMapDepsComposer<RA, KA, NM>;
}

interface GearMapDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> {
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, NM>;
  readonly define: GearMapDefiner<RA, KA, NM>;
}

interface GearListDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> {
  readonly reactive: ReactiveGearListDepsComposer<RA, KA, NL>;
  readonly define: GearListDefiner<RA, KA, NL>;
}
