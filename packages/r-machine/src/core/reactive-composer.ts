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
import type { ResKit } from "./res-kit.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type {
  AnyState,
  StatefulReactiveGearListComposer,
  StatefulReactiveGearMapComposer,
} from "./stateful-reactive-gear.js";
import type { StatelessReactiveGearListComposer, StatelessReactiveGearMapComposer } from "./stateless-reactive-gear.js";

export interface ReactiveComposer<RA extends AnyResAtlas, KA extends ResKit<RA>> {
  <S extends AnyState>(state: S): StatefulReactiveComposer<RA, KA, S>;
  (): StatelessReactiveComposer<RA, KA>;
}

type StatefulReactiveComposer<RA extends AnyResAtlas, KA extends ResKit<RA>, S extends AnyState> = {
  readonly gear: StatefulReactiveGearMapComposer<RA, KA["gear"], {}, S>;
  readonly vertexGear: StatefulReactiveGearMapComposer<RA, KA["gear"], {}, S>;
};

type StatelessReactiveComposer<RA extends AnyResAtlas, KA extends ResKit<RA>> = {
  readonly gear: StatelessReactiveGearMapComposer<RA, KA["gear"], {}>;
  readonly vertexGear: StatelessReactiveGearMapComposer<RA, KA["gear"], {}>;
};

export interface ReactiveConnectedMapComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NM extends NamespaceMap<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveConnectedMapComposer<RA, KA, NM, S>;
  (): StatelessReactiveConnectedMapComposer<RA, KA, NM>;
}

type StatefulReactiveConnectedMapComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> = {
  readonly gear: StatefulReactiveGearMapComposer<RA, KA["gear"], NM, S>;
  readonly vertexGear: StatefulReactiveGearMapComposer<RA, KA["gear"], NM, S>;
};

type StatelessReactiveConnectedMapComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NM extends NamespaceMap<RA>,
> = {
  readonly gear: StatelessReactiveGearMapComposer<RA, KA["gear"], NM>;
  readonly vertexGear: StatelessReactiveGearMapComposer<RA, KA["gear"], NM>;
};

export interface ReactiveConnectedListComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NL extends NamespaceList<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveConnectedListComposer<RA, KA, NL, S>;
  (): StatelessReactiveConnectedListComposer<RA, KA, NL>;
}

type StatefulReactiveConnectedListComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> = {
  readonly gear: StatefulReactiveGearListComposer<RA, KA["gear"], NL, S>;
  readonly vertexGear: StatefulReactiveGearListComposer<RA, KA["gear"], NL, S>;
};

type StatelessReactiveConnectedListComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NL extends NamespaceList<RA>,
> = {
  readonly gear: StatelessReactiveGearListComposer<RA, KA["gear"], NL>;
  readonly vertexGear: StatelessReactiveGearListComposer<RA, KA["gear"], NL>;
};
