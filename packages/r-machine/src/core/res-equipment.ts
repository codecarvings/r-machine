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

import type { BaseGearNamespaceList } from "./base-gear-plug.js";
import type { GearPlugKitMap } from "./gear-plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ShellPlugKitMap } from "./shell-plug.js";

export interface ResEquipment<
  RA extends AnyResAtlas,
  BGL extends BaseGearNamespaceList<RA> = [],
  GK extends GearPlugKitMap<RA> = {},
  SK extends ShellPlugKitMap<RA, BGL> = {},
> {
  readonly bridgeGears: BGL;
  readonly gearKit: GK;
  readonly shellKit: SK;
}

export type AnyResEquipment<RA extends AnyResAtlas = AnyResAtlas> = ResEquipment<RA, any, any>;
