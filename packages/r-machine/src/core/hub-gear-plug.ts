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

import type { GearListPlugHead, GearMapPlugHead, GearPlugKitMap } from "./gear-plug.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList, NamespaceList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";

export type HubGearPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "shape@gear:hub">;
export type HubGearPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "shape@gear:hub">;

export type HubGearNamespaceList<RA extends AnyResAtlas> = NamespaceList<RA, "shape@gear:hub">;

type HubGearPluginCtx<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> = PluginCtx<RA, KM>;

export type HubGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends HubGearPlugDepMap<RA>,
> = MapPlugin<RA, DM, HubGearPluginCtx<RA, KM>>;

export type HubGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HubGearPlugDepList<RA>,
> = ListPlugin<RA, DL, HubGearPluginCtx<RA, KM>>;

type HubGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends HubGearPlugDepMap<RA>,
> = GearMapPlugHead<"hub", RA, KM, DM, HubGearPluginCtx<RA, KM>>;

type HubGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HubGearPlugDepList<RA>,
> = GearListPlugHead<"hub", RA, KM, DL, HubGearPluginCtx<RA, KM>>;

export interface HubGearMapPlug<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DM extends HubGearPlugDepMap<RA>>
  extends PlugBody<HubGearMapPlugHead<RA, KM, DM>> {}

export interface HubGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HubGearPlugDepList<RA>,
> extends PlugBody<HubGearListPlugHead<RA, KM, DL>> {}
