/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Namespace } from "#r-machine/core";
import type { GearListPlugHead, GearMapPlugHead, GearPluginCtx, GearPlugKitMap } from "./gear-plug.js";
import type { ListPlugin, MapPlugin, PlugBody } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { DepHandleList } from "./res-list.js";
import type { DepHandleMap } from "./res-map.js";
import type { AnyPortMap } from "./res-plug.js";

export type BaseGearPlugDepMap<RA extends AnyResAtlas> = DepHandleMap<RA, "shape@gear:base">;
export type BaseGearPlugDepList<RA extends AnyResAtlas> = DepHandleList<RA, "shape@gear:base">;
export type BaseGearPlugPortMap = AnyPortMap;

// export type BaseGearNamespaceList<RA extends AnyResAtlas> = NamespaceList<RA, "shape@gear:base">;
export type BaseGearNamespaceList<RA extends AnyResAtlas> = Namespace<RA["shape@gear:base"]>[]; // Not Readonly param

type BaseGearPluginCtx<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  PM extends BaseGearPlugPortMap,
> = GearPluginCtx<RA, KM, PM>;

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
