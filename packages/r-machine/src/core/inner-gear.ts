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

type InnerGearPluginCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>> = PluginCtx<RA, KM>;

export type InnerGearMapPlugin<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = MapPlugin<
  RA,
  DM,
  InnerGearPluginCtx<RA, KM>
>;

export type InnerGearListPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = ListPlugin<RA, DL, InnerGearPluginCtx<RA, KM>>;

type InnerGearMapPlugHead<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = GearMapPlugHead<
  "inner",
  RA,
  KM,
  DM,
  InnerGearPluginCtx<RA, KM>
>;

type InnerGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = GearListPlugHead<"inner", RA, KM, DL, InnerGearPluginCtx<RA, KM>>;

interface InnerGearMapPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>
  extends PlugBody<InnerGearMapPlugHead<RA, KM, DM>> {}

interface InnerGearListPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>
  extends PlugBody<InnerGearListPlugHead<RA, KM, DL>> {}

export type InnerGearMapDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: InnerGearMapPlugin<RA, KM, DM>) => R | Promise<R>
) => ResMatrix<R, InnerGearMapPlug<RA, KM, DM>>;

export type InnerGearListDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: InnerGearListPlugin<RA, KM, DL>) => R | Promise<R>
) => ResMatrix<R, InnerGearListPlug<RA, KM, DL>>;
