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

import type { BaseGearPlugPortMap } from "./base-gear-plug.js";
import type { GearListPlugHead, GearMapPlugHead, GearPluginCtx, GearPlugKitMap } from "./gear-plug.js";
import type { ListPlugin, MapPlugin, PlugBody } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { DepHandleList } from "./res-list.js";
import type { DepHandleMap } from "./res-map.js";

export type InnerGearPlugDepMap<RA extends AnyResAtlas> = DepHandleMap<RA, "valid@gear:inner">;
export type InnerGearPlugDepList<RA extends AnyResAtlas> = DepHandleList<RA, "valid@gear:inner">;

type InnerGearPluginCtx<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  PM extends BaseGearPlugPortMap,
> = GearPluginCtx<RA, KM, PM>;

export type InnerGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = MapPlugin<RA, DM, InnerGearPluginCtx<RA, KM, PM>>;

export type InnerGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = ListPlugin<RA, DL, InnerGearPluginCtx<RA, KM, PM>>;

type InnerGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = GearMapPlugHead<"inner", RA, KM, DM, PM, InnerGearPluginCtx<RA, KM, PM>>;

type InnerGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = GearListPlugHead<"inner", RA, KM, DL, PM, InnerGearPluginCtx<RA, KM, PM>>;

export interface InnerGearMapPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> extends PlugBody<InnerGearMapPlugHead<RA, KM, DM, PM>> {}

export interface InnerGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> extends PlugBody<InnerGearListPlugHead<RA, KM, DL, PM>> {}
