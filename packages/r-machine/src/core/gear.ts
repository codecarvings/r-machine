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

import type { AnyResAtlas, ResMatrix } from "#r-machine/core";
import type { CmdComposer } from "./cmd.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { RelayComposer } from "./relay.js";
import type { AnyRes } from "./res.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

export interface GearCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type GatePluginCtx<RA extends AnyResAtlas, KA extends NamespaceMap<RA>> = PluginCtx<RA, KA>;

export type GearMapPlugin<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> = MapPlugin<
  RA,
  NM,
  GatePluginCtx<RA, KA>
>;

export type GearListPlugin<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = ListPlugin<RA, NL, GatePluginCtx<RA, KA>>;

type GearMapPlugHead<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> = ResMapPlugHead<
  "gear",
  RA,
  KA,
  NM,
  GatePluginCtx<RA, KA>
>;

type GearListPlugHead<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = ResListPlugHead<"gear", RA, KA, NL, GatePluginCtx<RA, KA>>;

interface GearMapPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>
  extends PlugBody<GearMapPlugHead<RA, KA, NM>> {}

interface GearListPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>>
  extends PlugBody<GearListPlugHead<RA, KA, NL>> {}

export type GearMapDefiner<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: GearMapPlugin<RA, KA, NM>, _: GearCursor) => R | Promise<R>
) => ResMatrix<R, GearMapPlug<RA, KA, NM>>;

export type GearListDefiner<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: GearListPlugin<RA, KA, NL>, _: GearCursor) => R | Promise<R>
) => ResMatrix<R, GearListPlug<RA, KA, NL>>;
