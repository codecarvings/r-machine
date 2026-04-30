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
import type { ListPlugin, MapPlugin, PlugBody } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList, NamespaceList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { AnyPortMap, ResPluginCtx } from "./res-plug.js";

export type BaseGearPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "shape@gear:base">;
export type BaseGearPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "shape@gear:base">;
export type BaseGearPlugPortMap = AnyPortMap;

export type BaseGearNamespaceList<RA extends AnyResAtlas> = NamespaceList<RA, "shape@gear:base">;

type BaseGearPluginCtx<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  PM extends BaseGearPlugPortMap,
> = ResPluginCtx<RA, KM, PM>;

export type BaseGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = MapPlugin<RA, DM, BaseGearPluginCtx<RA, KM, PM>>;

export type BaseGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = ListPlugin<RA, DL, BaseGearPluginCtx<RA, KM, PM>>;

type BaseGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = GearMapPlugHead<"base", RA, KM, DM, PM, BaseGearPluginCtx<RA, KM, PM>>;

type BaseGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = GearListPlugHead<"base", RA, KM, DL, PM, BaseGearPluginCtx<RA, KM, PM>>;

export interface BaseGearMapPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> extends PlugBody<BaseGearMapPlugHead<RA, KM, DM, PM>> {}

export interface BaseGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> extends PlugBody<BaseGearListPlugHead<RA, KM, DL, PM>> {}
