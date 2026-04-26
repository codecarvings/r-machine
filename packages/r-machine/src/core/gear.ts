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

import type { CmdComposer } from "./cmd.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { RelayComposer } from "./relay.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

export type GearRole = "hub" | "server" | "client";

export interface GearCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type GearPluginCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>> = PluginCtx<RA, KM>;

export type GearMapPlugin<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = MapPlugin<
  RA,
  DM,
  GearPluginCtx<RA, KM>
>;

export type GearListPlugin<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> = ListPlugin<
  RA,
  DL,
  GearPluginCtx<RA, KM>
>;

type GearMapPlugHead<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = ResMapPlugHead<
  "gear",
  RA,
  KM,
  DM,
  GearPluginCtx<RA, KM>
>;

type GearListPlugHead<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> = ResListPlugHead<
  "gear",
  RA,
  KM,
  DL,
  GearPluginCtx<RA, KM>
>;

interface GearMapPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>
  extends PlugBody<GearMapPlugHead<RA, KM, DM>> {}

interface GearListPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>
  extends PlugBody<GearListPlugHead<RA, KM, DL>> {}

export type GearMapDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: GearMapPlugin<RA, KM, DM>, _: GearCursor) => R | Promise<R>
) => ResMatrix<R, GearMapPlug<RA, KM, DM>>;

export type GearListDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: GearListPlugin<RA, KM, DL>, _: GearCursor) => R | Promise<R>
) => ResMatrix<R, GearListPlug<RA, KM, DL>>;
