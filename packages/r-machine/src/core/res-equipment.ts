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
  BGL extends BridgeGearNamespaceList<RA> = [],
  GK extends GearKit<RA> = {},
  SK extends ShellKit<RA, BGL> = {},
  XK extends GateKit<RA> = {},
> {
  readonly bridgeGears: BGL;
  readonly gearKit: GK;
  readonly shellKit: SK;
  readonly gateKit: XK;
}

export type KitKind = "gear" | "shell" | "gate";

export type AnyResEquipment<RA extends AnyResAtlas = AnyResAtlas> = ResEquipment<RA, any, any, any, any>;

export type BridgeGearNamespaceList<RA extends AnyResAtlas> = Namespace<RA["shape@gear"]>[];

export type GearKit<RA extends AnyResAtlas> = {
  readonly [key: string]: Namespace<RA["shape@gear"]>;
};

export type ShellKit<RA extends AnyResAtlas, BGL extends BridgeGearNamespaceList<RA>> = {
  readonly [key: string]: Namespace<RA["shape@shell:*"]> | BGL[number];
};

export type GateKit<RA extends AnyResAtlas> = {
  readonly [key: string]: Namespace<RA["shape"]>;
};
