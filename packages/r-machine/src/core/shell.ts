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

import type { AnyLocale } from "#r-machine/locale";
import type { ListPlugin, LocaleAwarePluginCtx, MapPlugin, PlugBody } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

type ShellPluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = LocaleAwarePluginCtx<
  RA,
  L,
  KA
>;

type ShellMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = MapPlugin<RA, NM, ShellPluginCtx<RA, L, KA>>;

type ShellListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = ListPlugin<RA, NL, ShellPluginCtx<RA, L, KA>>;

type ShellMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = ResMapPlugHead<"shell", RA, KA, NM, ShellPluginCtx<RA, L, KA>>;

type ShellListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = ResListPlugHead<"shell", RA, KA, NL, ShellPluginCtx<RA, L, KA>>;

interface ShellMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> extends PlugBody<ShellMapPlugHead<RA, L, KA, NM>> {}

interface ShellListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> extends PlugBody<ShellListPlugHead<RA, L, KA, NL>> {}

export type ShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = <R extends AnyRes>(
  factory: (plugin: ShellMapPlugin<RA, L, KA, NM>) => R | Promise<R>
) => ResMatrix<R, ShellMapPlug<RA, L, KA, NM>>;

export type ShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = <R extends AnyRes>(
  factory: (plugin: ShellListPlugin<RA, L, KA, NL>) => R | Promise<R>
) => ResMatrix<R, ShellListPlug<RA, L, KA, NL>>;
