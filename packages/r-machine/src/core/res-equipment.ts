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
import type { Namespace } from "./res-domain.js";

export interface ResEquipment<
  RA extends AnyResAtlas,
  BG extends BridgeGearNamespace<RA> = [],
  GKA extends GearKit<RA> = {},
  SKA extends ShellKit<RA, BG> = {},
  XKA extends GateKit<RA> = {},
> {
  readonly bridgeGears: BG;
  readonly gearKit: GKA;
  readonly shellKit: SKA;
  readonly gateKit: XKA;
}

export type BridgeGearNamespace<RA extends AnyResAtlas> = readonly Namespace<RA["gear"]>[];

export type GearKit<RA extends AnyResAtlas> = {
  readonly [key: string]: Namespace<RA["gear"]>;
};

export type ShellKit<RA extends AnyResAtlas, BG extends BridgeGearNamespace<RA>> = {
  readonly [key: string]: Namespace<RA["shell"]> | BG[number];
};

export type GateKit<RA extends AnyResAtlas> = {
  readonly [key: string]: Namespace<RA["res"]>;
};
