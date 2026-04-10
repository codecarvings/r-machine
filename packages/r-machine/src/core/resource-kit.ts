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

import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { ExplicitNamespaceMap } from "./resource-map.js";

export interface ResourceKit<
  RA extends AnyResourceAtlas,
  GKA extends ExplicitNamespaceMap<RA> = {},
  SKA extends ExplicitNamespaceMap<RA> = {},
  XKA extends ExplicitNamespaceMap<RA> = {},
> {
  readonly gear: GKA;
  readonly shell: SKA;
  readonly gate: XKA;
}
