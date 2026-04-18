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
import type { ExplicitNamespaceList } from "./res-list.js";
import type { ExplicitNamespaceMap } from "./res-map.js";

export interface ResEquipment<
  RA extends AnyResAtlas,
  GKA extends ExplicitNamespaceMap<RA> = {},
  SKA extends ExplicitNamespaceMap<RA> = {},
  XKA extends ExplicitNamespaceMap<RA> = {},
  BG extends ExplicitNamespaceList<RA> = [],
> {
  readonly gear: GKA;
  readonly shell: SKA;
  readonly gate: XKA;
  readonly bridgeGears: BG;
}
