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

import type { GearCursor } from "./gear.js";
import type { StatelessGetterComposer } from "./getter.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { ReactiveGearTag } from "./reactive-gear.js";
import type { AnyReactiveRes, RejectAsyncValueProps } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

interface StatelessReactiveGearCursor extends GearCursor {
  readonly getter: StatelessGetterComposer;
}

type StatelessReactiveGearPluginCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>> = PluginCtx<RA, KM>;

type StatelessReactiveGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = MapPlugin<RA, DM, StatelessReactiveGearPluginCtx<RA, KM>>;

type StatelessReactiveGearListPlugin<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = ListPlugin<RA, DL, StatelessReactiveGearPluginCtx<RA, KM>>;

type StatelessReactiveGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = ResMapPlugHead<"gear", RA, KM, DM, StatelessReactiveGearPluginCtx<RA, KM>>;

type StatelessReactiveGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = ResListPlugHead<"gear", RA, KM, DL, StatelessReactiveGearPluginCtx<RA, KM>>;

interface StatelessReactiveGearMapPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>
  extends PlugBody<StatelessReactiveGearMapPlugHead<RA, KM, DM>> {}

interface StatelessReactiveGearListPlug<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>
  extends PlugBody<StatelessReactiveGearListPlugHead<RA, KM, DL>> {}

export type StatelessReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessReactiveGearMapPlugin<RA, KM, DM>, _: StatelessReactiveGearCursor) => R | Promise<R>
) => ResMatrix<R & ReactiveGearTag, StatelessReactiveGearMapPlug<RA, KM, DM>>;

export type StatelessReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessReactiveGearListPlugin<RA, KM, DL>, _: StatelessReactiveGearCursor) => R | Promise<R>
) => ResMatrix<R & ReactiveGearTag, StatelessReactiveGearListPlug<RA, KM, DL>>;
