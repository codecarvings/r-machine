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
import type { GearListPlugHead, GearMapPlugHead } from "./gear-plug.js";
import type { StatelessGetterComposer } from "./getter.js";
import type { AnyOuterGear, RejectAsyncValueProps } from "./outer-gear.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { RelayComposer } from "./relay.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";

export interface StatelessOuterGearCursor {
  readonly getter: StatelessGetterComposer;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type StatelessOuterGearPluginCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>> = PluginCtx<RA, KM>;

type StatelessOuterGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = MapPlugin<RA, DM, StatelessOuterGearPluginCtx<RA, KM>>;

type StatelessOuterGearListPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = ListPlugin<RA, DL, StatelessOuterGearPluginCtx<RA, KM>>;

type StatelessOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = GearMapPlugHead<"outer", RA, KM, DM, StatelessOuterGearPluginCtx<RA, KM>>;

type StatelessOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = GearListPlugHead<"outer", RA, KM, DL, StatelessOuterGearPluginCtx<RA, KM>>;

interface StatelessOuterGearMapPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>
  extends PlugBody<StatelessOuterGearMapPlugHead<RA, KM, DM>> {}

interface StatelessOuterGearListPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>
  extends PlugBody<StatelessOuterGearListPlugHead<RA, KM, DL>> {}

export type StatelessOuterGearMapDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> = <
  R extends AnyOuterGear & RejectAsyncValueProps<R>,
>(
  factory: (plugin: StatelessOuterGearMapPlugin<RA, KM, DM>, _: StatelessOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearMapPlug<RA, KM, DM>>;

export type StatelessOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearListPlugin<RA, KM, DL>, _: StatelessOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearListPlug<RA, KM, DL>>;
