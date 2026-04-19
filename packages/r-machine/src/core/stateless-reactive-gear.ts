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
import type { AnyResDomain } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

interface StatelessReactiveGearCursor extends GearCursor {
  readonly getter: StatelessGetterComposer;
}

type StatelessReactiveGearPluginCtx<RD extends AnyResDomain, KA extends NamespaceMap<RD>> = PluginCtx<RD, KA>;

type StatelessReactiveGearMapPlugin<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> = MapPlugin<RD, NM, StatelessReactiveGearPluginCtx<RD, KA>>;

type StatelessReactiveGearListPlugin<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> = ListPlugin<RD, NL, StatelessReactiveGearPluginCtx<RD, KA>>;

type StatelessReactiveGearMapPlugHead<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> = ResMapPlugHead<"gear", RD, KA, NM, StatelessReactiveGearPluginCtx<RD, KA>>;

type StatelessReactiveGearListPlugHead<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> = ResListPlugHead<"gear", RD, KA, NL, StatelessReactiveGearPluginCtx<RD, KA>>;

interface StatelessReactiveGearMapPlug<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> extends PlugBody<StatelessReactiveGearMapPlugHead<RD, KA, NM>> {}

interface StatelessReactiveGearListPlug<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> extends PlugBody<StatelessReactiveGearListPlugHead<RD, KA, NL>> {}

export type StatelessReactiveGearMapDefiner<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  T,
> = <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessReactiveGearMapPlugin<RD, KA, NM>, _: StatelessReactiveGearCursor) => R | Promise<R>
) => ResMatrix<R & T & ReactiveGearTag, StatelessReactiveGearMapPlug<RD, KA, NM>>;

export type StatelessReactiveGearListDefiner<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  T,
> = <R extends AnyReactiveRes & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessReactiveGearListPlugin<RD, KA, NL>, _: StatelessReactiveGearCursor) => R | Promise<R>
) => ResMatrix<R & T & ReactiveGearTag, StatelessReactiveGearListPlug<RD, KA, NL>>;
