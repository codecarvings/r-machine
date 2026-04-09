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

import type { PlainGearListPlug, PlainGearMapPlug } from "./plain-gear.js";
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { NamespaceList } from "./resource-list.js";
import type { NamespaceMap } from "./resource-map.js";
import type { AnyState, StatefulReactiveListPlug, StatefulReactiveMapPlug } from "./stateful-reactive-gear.js";
import type { StatelessReactiveListPlug, StatelessReactiveMapPlug } from "./stateless-reactive-gear.js";

export interface GearPlugComposer<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>> {
  (): GearMapPlug<RA, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): GearListPlug<RA, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): GearMapPlug<RA, KA, NM>;
}

interface GearMapPlug<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> {
  plain(): PlainGearMapPlug<RA, KA, NM>;
  reactive<S extends AnyState>(state: S): StatefulReactiveMapPlug<RA, KA, NM, S>;
  reactive(): StatelessReactiveMapPlug<RA, KA, NM>;
}

interface GearListPlug<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> {
  plain(): PlainGearListPlug<RA, KA, NL>;
  reactive<S extends AnyState>(state: S): StatefulReactiveListPlug<RA, KA, NL, S>;
  reactive(): StatelessReactiveListPlug<RA, KA, NL>;
}
