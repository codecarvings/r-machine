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
import type { GearListComposer, GearMapComposer } from "./gear.js";
import type { ReactiveConnectedListComposer, ReactiveConnectedMapComposer } from "./reactive-composer.js";
import { type AnyResAtlas, isNamespace } from "./res-atlas.js";
import type { ResKit } from "./res-kit.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ShellListComposer, ShellMapComposer } from "./shell.js";
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

  readonly gear: GearMapComposer<RA, KA["gear"], NM>;
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

  readonly gear: GearListComposer<RA, KA["gear"], NL>;
  readonly vertexGear: GearListComposer<RA, KA["gear"], NL, VertexGearTag>;
  readonly shell: ShellListComposer<RA, L, KA["shell"], NL>;
}

export function createConnectedComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
>(): ConnectedComposer<RA, L, KA> {
  function connected(...args: any[]): any {
    const length = args.length;
    if (length === 0) {
      return createConnectedMapComposer<RA, L, KA, {}>({});
    } else if (length === 1 && !isNamespace(args[0])) {
      return createConnectedMapComposer<RA, L, KA, any>(args[0]);
    } else {
      return createConnectedListComposer<RA, L, KA, any>(args as any);
    }
  }
  return connected;
}

function createConnectedMapComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  NM extends NamespaceMap<RA>,
>(_map: NM): ConnectedMapComposer<RA, L, KA, NM> {
  return {} as ConnectedMapComposer<RA, L, KA, NM>;
}

function createConnectedListComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  NL extends NamespaceList<RA>,
>(_list: NL): ConnectedListComposer<RA, L, KA, NL> {
  return {} as ConnectedListComposer<RA, L, KA, NL>;
}
