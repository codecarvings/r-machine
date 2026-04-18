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

import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type {
  AnyState,
  StatefulReactiveGearListDefiner,
  StatefulReactiveGearMapDefiner,
  StatefulReactiveGearTag,
} from "./stateful-reactive-gear.js";
import type {
  StatelessReactiveGearListDefiner,
  StatelessReactiveGearMapDefiner,
  StatelessReactiveGearTag,
} from "./stateless-reactive-gear.js";

export interface ReactiveGearMapDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearMapComposer<RA, KA, NM, S, StatefulReactiveGearTag>;
  (): StatelessReactiveGearMapComposer<RA, KA, NM, StatelessReactiveGearTag>;
}

export interface ReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearListComposer<RA, KA, NL, S, StatefulReactiveGearTag>;
  (): StatelessReactiveGearListComposer<RA, KA, NL, StatelessReactiveGearTag>;
}

interface StatefulReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
  T,
> {
  readonly define: StatefulReactiveGearMapDefiner<RA, KA, NM, S, T>;
}

interface StatefulReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
  T,
> {
  readonly define: StatefulReactiveGearListDefiner<RA, KA, NL, S, T>;
}

interface StatelessReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  T,
> {
  readonly define: StatelessReactiveGearMapDefiner<RA, KA, NM, T>;
}

interface StatelessReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  T,
> {
  readonly define: StatelessReactiveGearListDefiner<RA, KA, NL, T>;
}
