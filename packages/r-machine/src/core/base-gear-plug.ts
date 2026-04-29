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

export type BaseGearPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "shape@gear:base">;
export type BaseGearPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "shape@gear:base">;

export type BaseGearNamespaceList<RA extends AnyResAtlas> = NamespaceList<RA, "shape@gear:base">;

type BaseGearPluginCtx<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> = PluginCtx<RA, KM>;

export type BaseGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
> = MapPlugin<RA, DM, BaseGearPluginCtx<RA, KM>>;

export type BaseGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
> = ListPlugin<RA, DL, BaseGearPluginCtx<RA, KM>>;

type BaseGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
> = GearMapPlugHead<"base", RA, KM, DM, BaseGearPluginCtx<RA, KM>>;

type BaseGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
> = GearListPlugHead<"base", RA, KM, DL, BaseGearPluginCtx<RA, KM>>;

export interface BaseGearMapPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
> extends PlugBody<BaseGearMapPlugHead<RA, KM, DM>> {}

export interface BaseGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
> extends PlugBody<BaseGearListPlugHead<RA, KM, DL>> {}
