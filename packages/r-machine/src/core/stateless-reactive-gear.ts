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
import type { AnyReactiveRes, RejectAsyncValueProps } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

declare const statelessReactiveGearSymbol: unique symbol;
export interface StatelessReactiveGearTag {
  readonly [statelessReactiveGearSymbol]?: typeof statelessReactiveGearSymbol;
}

interface StatelessReactiveGearCursor extends GearCursor {
  readonly getter: StatelessGetterComposer;
}

type StatelessReactiveGearPluginCtx<RA extends AnyResAtlas, KA extends NamespaceMap<RA>> = PluginCtx<RA, KA>;

type StatelessReactiveGearMapPlugin<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = MapPlugin<RA, NM, StatelessReactiveGearPluginCtx<RA, KA>>;

type StatelessReactiveGearListPlugin<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = ListPlugin<RA, NL, StatelessReactiveGearPluginCtx<RA, KA>>;

type StatelessReactiveGearMapPlugHead<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = ResMapPlugHead<"gear", RA, KA, NM, StatelessReactiveGearPluginCtx<RA, KA>>;

type StatelessReactiveGearListPlugHead<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = ResListPlugHead<"gear", RA, KA, NL, StatelessReactiveGearPluginCtx<RA, KA>>;

interface StatelessReactiveGearMapPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>
  extends PlugBody<StatelessReactiveGearMapPlugHead<RA, KA, NM>> {}

interface StatelessReactiveGearListPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> extends PlugBody<StatelessReactiveGearListPlugHead<RA, KA, NL>> {}

export type StatelessReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  T,
> = <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessReactiveGearMapPlugin<RA, KA, NM>, _: StatelessReactiveGearCursor) => R | Promise<R>
) => ResMatrix<R & T, StatelessReactiveGearMapPlug<RA, KA, NM>>;

export type StatelessReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  T,
> = <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessReactiveGearListPlugin<RA, KA, NL>, _: StatelessReactiveGearCursor) => R | Promise<R>
) => ResMatrix<R & T, StatelessReactiveGearListPlug<RA, KA, NL>>;
