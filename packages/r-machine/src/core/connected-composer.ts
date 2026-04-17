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

import type { AnyLocale } from "#r-machine/locale";
import type { GearListComposer, GearMapComposer, GearTag } from "./gear.js";
import { createGearListComposer, createGearMapComposer } from "./gear-composer.js";
import {
  createReactiveConnectedListComposer,
  createReactiveConnectedMapComposer,
  type ReactiveConnectedListComposer,
  type ReactiveConnectedMapComposer,
} from "./reactive-composer.js";
import { type AnyResAtlas, isNamespace } from "./res-atlas.js";
import type { ResKit } from "./res-kit.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResWireProvider } from "./res-wire.js";
import type { ShellListComposer, ShellMapComposer } from "./shell.js";
import { createShellListComposer, createShellMapComposer } from "./shell-composer.js";
import type { VertexGearTag } from "./vertex-gear.js";

export interface ConnectedComposer<RA extends AnyResAtlas, L extends AnyLocale, KA extends ResKit<RA>> {
  (): ConnectedMapComposer<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): ConnectedListComposer<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): ConnectedMapComposer<RA, L, KA, NM>;
}

interface ConnectedMapComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly reactive: ReactiveConnectedMapComposer<RA, KA, NM>;

  readonly gear: GearMapComposer<RA, KA["gear"], NM, GearTag>;
  readonly vertexGear: GearMapComposer<RA, KA["gear"], NM, VertexGearTag>;
  readonly shell: ShellMapComposer<RA, L, KA["shell"], NM>;
}

interface ConnectedListComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly reactive: ReactiveConnectedListComposer<RA, KA, NL>;

  readonly gear: GearListComposer<RA, KA["gear"], NL, GearTag>;
  readonly vertexGear: GearListComposer<RA, KA["gear"], NL, VertexGearTag>;
  readonly shell: ShellListComposer<RA, L, KA["shell"], NL>;
}

export function createConnectedComposer<RA extends AnyResAtlas, L extends AnyLocale, KA extends ResKit<RA>>(
  resWireProvider: ResWireProvider
): ConnectedComposer<RA, L, KA> {
  function connected(...args: any[]): any {
    const length = args.length;
    if (length === 0) {
      return createConnectedMapComposer<RA, L, KA, {}>(resWireProvider, {});
    } else if (length === 1 && !isNamespace(args[0])) {
      return createConnectedMapComposer<RA, L, KA, any>(resWireProvider, args[0]);
    } else {
      return createConnectedListComposer<RA, L, KA, any>(resWireProvider, args as any);
    }
  }
  return connected;
}

function createConnectedMapComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  NM extends NamespaceMap<RA>,
>(provider: ResWireProvider, namespaces: NM): ConnectedMapComposer<RA, L, KA, NM> {
  let reactive: ReactiveConnectedMapComposer<RA, KA, NM> | undefined;
  let gear: GearMapComposer<RA, KA["gear"], NM, GearTag> | undefined;
  let vertexGear: GearMapComposer<RA, KA["gear"], NM, VertexGearTag> | undefined;
  let shell: ShellMapComposer<RA, L, KA["shell"], NM> | undefined;

  return {
    get reactive() {
      if (reactive === undefined) {
        reactive = createReactiveConnectedMapComposer<RA, KA, NM>(provider, namespaces);
      }
      return reactive;
    },
    get gear() {
      if (gear === undefined) {
        gear = createGearMapComposer<RA, KA["gear"], NM, GearTag>(provider, namespaces, false);
      }
      return gear;
    },
    get vertexGear() {
      if (vertexGear === undefined) {
        vertexGear = createGearMapComposer<RA, KA["gear"], NM, VertexGearTag>(provider, namespaces, true);
      }
      return vertexGear;
    },
    get shell() {
      if (shell === undefined) {
        shell = createShellMapComposer<RA, L, KA["shell"], NM>(provider, namespaces);
      }
      return shell;
    },
  };
}

function createConnectedListComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  NL extends NamespaceList<RA>,
>(provider: ResWireProvider, namespaces: NL): ConnectedListComposer<RA, L, KA, NL> {
  let reactive: ReactiveConnectedListComposer<RA, KA, NL> | undefined;
  let gear: GearListComposer<RA, KA["gear"], NL, GearTag> | undefined;
  let vertexGear: GearListComposer<RA, KA["gear"], NL, VertexGearTag> | undefined;
  let shell: ShellListComposer<RA, L, KA["shell"], NL> | undefined;

  return {
    get reactive() {
      if (reactive === undefined) {
        reactive = createReactiveConnectedListComposer<RA, KA, NL>(provider, namespaces);
      }
      return reactive;
    },
    get gear() {
      if (gear === undefined) {
        gear = createGearListComposer<RA, KA["gear"], NL, GearTag>(provider, namespaces, false);
      }
      return gear;
    },
    get vertexGear() {
      if (vertexGear === undefined) {
        vertexGear = createGearListComposer<RA, KA["gear"], NL, VertexGearTag>(provider, namespaces, true);
      }
      return vertexGear;
    },
    get shell() {
      if (shell === undefined) {
        shell = createShellListComposer<RA, L, KA["shell"], NL>(provider, namespaces);
      }
      return shell;
    },
  };
}
