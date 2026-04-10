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
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { ResourceKit } from "./resource-kit.js";
import type { NamespaceList } from "./resource-list.js";
import type { NamespaceMap } from "./resource-map.js";

import type { ShellListComposer, ShellMapComposer } from "./shell.js";

export interface ConnectedComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends ResourceKit<RA>> {
  (): ConnectedMapComposer<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): ConnectedListComposer<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): ConnectedMapComposer<RA, L, KA, NM>;
}

interface ConnectedMapComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends ResourceKit<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly reactive: ReactiveConnectedMapComposer<RA, KA, NM>;

  readonly gear: GearMapComposer<RA, KA["gear"], NM>;
  readonly vertexGear: GearMapComposer<RA, KA["gear"], NM>;
  readonly shell: ShellMapComposer<RA, L, KA["shell"], NM>;
}

interface ConnectedListComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends ResourceKit<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly reactive: ReactiveConnectedListComposer<RA, KA, NL>;

  readonly gear: GearListComposer<RA, KA["gear"], NL>;
  readonly vertexGear: GearListComposer<RA, KA["gear"], NL>;
  readonly shell: ShellListComposer<RA, L, KA["shell"], NL>;
}
