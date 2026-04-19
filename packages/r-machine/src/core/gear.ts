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

import type { ResMatrix } from "#r-machine/core";
import type { CmdComposer } from "./cmd.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { RelayComposer } from "./relay.js";
import type { AnyRes } from "./res.js";
import type { AnyResDomain } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

export interface GearCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type GatePluginCtx<RD extends AnyResDomain, KA extends NamespaceMap<RD>> = PluginCtx<RD, KA>;

export type GearMapPlugin<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> = MapPlugin<RD, NM, GatePluginCtx<RD, KA>>;

export type GearListPlugin<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> = ListPlugin<RD, NL, GatePluginCtx<RD, KA>>;

type GearMapPlugHead<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> = ResMapPlugHead<"gear", RD, KA, NM, GatePluginCtx<RD, KA>>;

type GearListPlugHead<
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> = ResListPlugHead<"gear", RD, KA, NL, GatePluginCtx<RD, KA>>;

interface GearMapPlug<RD extends AnyResDomain, KA extends NamespaceMap<RD>, NM extends NamespaceMap<RD>>
  extends PlugBody<GearMapPlugHead<RD, KA, NM>> {}

interface GearListPlug<RD extends AnyResDomain, KA extends NamespaceMap<RD>, NL extends NamespaceList<RD>>
  extends PlugBody<GearListPlugHead<RD, KA, NL>> {}

export type GearMapDefiner<RD extends AnyResDomain, KA extends NamespaceMap<RD>, NM extends NamespaceMap<RD>> = <
  R extends AnyRes,
>(
  factory: (plugin: GearMapPlugin<RD, KA, NM>, _: GearCursor) => R | Promise<R>
) => ResMatrix<R, GearMapPlug<RD, KA, NM>>;

export type GearListDefiner<RD extends AnyResDomain, KA extends NamespaceMap<RD>, NL extends NamespaceList<RD>> = <
  R extends AnyRes,
>(
  factory: (plugin: GearListPlugin<RD, KA, NL>, _: GearCursor) => R | Promise<R>
) => ResMatrix<R, GearListPlug<RD, KA, NL>>;
