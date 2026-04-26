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

import type { GearListPlugHead, GearMapPlugHead } from "./gear-plug.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";

type HubGearPluginCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>> = PluginCtx<RA, KM>;

export type HubGearMapPlugin<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = MapPlugin<
  RA,
  DM,
  HubGearPluginCtx<RA, KM>
>;

export type HubGearListPlugin<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> = ListPlugin<
  RA,
  DL,
  HubGearPluginCtx<RA, KM>
>;

type HubGearMapPlugHead<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = GearMapPlugHead<
  "hub",
  RA,
  KM,
  DM,
  HubGearPluginCtx<RA, KM>
>;

type HubGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = GearListPlugHead<"hub", RA, KM, DL, HubGearPluginCtx<RA, KM>>;

interface HubGearMapPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>
  extends PlugBody<HubGearMapPlugHead<RA, KM, DM>> {}

interface HubGearListPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>
  extends PlugBody<HubGearListPlugHead<RA, KM, DL>> {}

export type HubGearMapDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: HubGearMapPlugin<RA, KM, DM>) => R | Promise<R>
) => ResMatrix<R, HubGearMapPlug<RA, KM, DM>>;

export type HubGearListDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: HubGearListPlugin<RA, KM, DL>) => R | Promise<R>
) => ResMatrix<R, HubGearListPlug<RA, KM, DL>>;
