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

import {
  createStatefulReactiveGearListComposer,
  createStatefulReactiveGearMapComposer,
  createStatelessReactiveGearListComposer,
  createStatelessReactiveGearMapComposer,
} from "./reactive-gear-composer.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResKit } from "./res-kit.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResWireProvider } from "./res-wire.js";
import type {
  AnyState,
  StatefulReactiveGearListComposer,
  StatefulReactiveGearMapComposer,
  StatefulReactiveGearTag,
} from "./stateful-reactive-gear.js";
import type {
  StatelessReactiveGearListComposer,
  StatelessReactiveGearMapComposer,
  StatelessReactiveGearTag,
} from "./stateless-reactive-gear.js";
import type { VertexGearTag } from "./vertex-gear.js";

export interface ReactiveComposer<RA extends AnyResAtlas, KA extends ResKit<RA>> {
  <S extends AnyState>(state: S): StatefulReactiveComposer<RA, KA, S>;
  (): StatelessReactiveComposer<RA, KA>;
}

type StatefulReactiveComposer<RA extends AnyResAtlas, KA extends ResKit<RA>, S extends AnyState> = {
  readonly gear: StatefulReactiveGearMapComposer<RA, KA["gear"], {}, S, StatefulReactiveGearTag>;
  readonly vertexGear: StatefulReactiveGearMapComposer<RA, KA["gear"], {}, S, StatefulReactiveGearTag & VertexGearTag>;
};

type StatelessReactiveComposer<RA extends AnyResAtlas, KA extends ResKit<RA>> = {
  readonly gear: StatelessReactiveGearMapComposer<RA, KA["gear"], {}, StatelessReactiveGearTag>;
  readonly vertexGear: StatelessReactiveGearMapComposer<RA, KA["gear"], {}, StatelessReactiveGearTag & VertexGearTag>;
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
  readonly gear: StatefulReactiveGearMapComposer<RA, KA["gear"], NM, S, StatefulReactiveGearTag>;
  readonly vertexGear: StatefulReactiveGearMapComposer<RA, KA["gear"], NM, S, StatefulReactiveGearTag & VertexGearTag>;
};

type StatelessReactiveConnectedMapComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NM extends NamespaceMap<RA>,
> = {
  readonly gear: StatelessReactiveGearMapComposer<RA, KA["gear"], NM, StatelessReactiveGearTag>;
  readonly vertexGear: StatelessReactiveGearMapComposer<RA, KA["gear"], NM, StatelessReactiveGearTag & VertexGearTag>;
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
  readonly gear: StatefulReactiveGearListComposer<RA, KA["gear"], NL, S, StatefulReactiveGearTag>;
  readonly vertexGear: StatefulReactiveGearListComposer<RA, KA["gear"], NL, S, StatefulReactiveGearTag & VertexGearTag>;
};

type StatelessReactiveConnectedListComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NL extends NamespaceList<RA>,
> = {
  readonly gear: StatelessReactiveGearListComposer<RA, KA["gear"], NL, StatelessReactiveGearTag>;
  readonly vertexGear: StatelessReactiveGearListComposer<RA, KA["gear"], NL, StatelessReactiveGearTag & VertexGearTag>;
};

export function createReactiveComposer<RA extends AnyResAtlas, KA extends ResKit<RA>>(
  provider: ResWireProvider
): ReactiveComposer<RA, KA> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        gear: createStatelessReactiveGearMapComposer<RA, KA["gear"], {}, StatelessReactiveGearTag>(provider, {}, false),
        vertexGear: createStatelessReactiveGearMapComposer<
          RA,
          KA["gear"],
          {},
          StatelessReactiveGearTag & VertexGearTag
        >(provider, {}, true),
      };
    }
    const [state] = args;
    return {
      gear: createStatefulReactiveGearMapComposer<RA, KA["gear"], {}, AnyState, StatefulReactiveGearTag>(
        provider,
        {},
        state,
        false
      ),
      vertexGear: createStatefulReactiveGearMapComposer<
        RA,
        KA["gear"],
        {},
        AnyState,
        StatefulReactiveGearTag & VertexGearTag
      >(provider, {}, state, true),
    };
  }) as ReactiveComposer<RA, KA>;
}

export function createReactiveConnectedMapComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NM extends NamespaceMap<RA>,
>(provider: ResWireProvider, namespaces: NM): ReactiveConnectedMapComposer<RA, KA, NM> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        gear: createStatelessReactiveGearMapComposer<RA, KA["gear"], NM, StatelessReactiveGearTag>(
          provider,
          namespaces,
          false
        ),
        vertexGear: createStatelessReactiveGearMapComposer<
          RA,
          KA["gear"],
          NM,
          StatelessReactiveGearTag & VertexGearTag
        >(provider, namespaces, true),
      };
    }
    const [state] = args;
    return {
      gear: createStatefulReactiveGearMapComposer<RA, KA["gear"], NM, AnyState, StatefulReactiveGearTag>(
        provider,
        namespaces,
        state,
        false
      ),
      vertexGear: createStatefulReactiveGearMapComposer<
        RA,
        KA["gear"],
        NM,
        AnyState,
        StatefulReactiveGearTag & VertexGearTag
      >(provider, namespaces, state, true),
    };
  }) as ReactiveConnectedMapComposer<RA, KA, NM>;
}

export function createReactiveConnectedListComposer<
  RA extends AnyResAtlas,
  KA extends ResKit<RA>,
  NL extends NamespaceList<RA>,
>(provider: ResWireProvider, namespaces: NL): ReactiveConnectedListComposer<RA, KA, NL> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        gear: createStatelessReactiveGearListComposer<RA, KA["gear"], NL, StatelessReactiveGearTag>(
          provider,
          namespaces,
          false
        ),
        vertexGear: createStatelessReactiveGearListComposer<
          RA,
          KA["gear"],
          NL,
          StatelessReactiveGearTag & VertexGearTag
        >(provider, namespaces, true),
      };
    }
    const [state] = args;
    return {
      gear: createStatefulReactiveGearListComposer<RA, KA["gear"], NL, AnyState, StatefulReactiveGearTag>(
        provider,
        namespaces,
        state,
        false
      ),
      vertexGear: createStatefulReactiveGearListComposer<
        RA,
        KA["gear"],
        NL,
        AnyState,
        StatefulReactiveGearTag & VertexGearTag
      >(provider, namespaces, state, true),
    };
  }) as ReactiveConnectedListComposer<RA, KA, NL>;
}
