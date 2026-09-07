/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BaseGearNamespaceList } from "./base-gear-plug.js";
import type { DirectPlugKitMap } from "./direct-plug.js";
import type { GearPlugKitMap } from "./gear-plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ShellPlugKitMap } from "./shell-plug.js";

export interface ResEquipment<
  RA extends AnyResAtlas,
  BGL extends BaseGearNamespaceList<RA> = [],
  GK extends GearPlugKitMap<RA> = {},
  SK extends ShellPlugKitMap<RA, BGL> = {},
  DK extends DirectPlugKitMap<RA> = {},
> {
  readonly bridgeGears: BGL;
  readonly gearKit: GK;
  readonly shellKit: SK;
  readonly directKit: DK;
}

export type AnyResEquipment<RA extends AnyResAtlas = AnyResAtlas> = ResEquipment<RA, any, any, any>;
