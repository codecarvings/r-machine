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
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";

export type InnerGearPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "valid@gear:inner">;
export type InnerGearPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "valid@gear:inner">;

type InnerGearPluginCtx<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> = PluginCtx<RA, KM>;

export type InnerGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
> = MapPlugin<RA, DM, InnerGearPluginCtx<RA, KM>>;

export type InnerGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
> = ListPlugin<RA, DL, InnerGearPluginCtx<RA, KM>>;

type InnerGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
> = GearMapPlugHead<"inner", RA, KM, DM, {}, InnerGearPluginCtx<RA, KM>>;

type InnerGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
> = GearListPlugHead<"inner", RA, KM, DL, {}, InnerGearPluginCtx<RA, KM>>;

export interface InnerGearMapPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
> extends PlugBody<InnerGearMapPlugHead<RA, KM, DM>> {}

export interface InnerGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
> extends PlugBody<InnerGearListPlugHead<RA, KM, DL>> {}
