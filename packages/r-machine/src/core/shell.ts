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
import type { AnyResDomain } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

type ShellPluginCtx<RD extends AnyResDomain, L extends AnyLocale, KA extends NamespaceMap<RD>> = LocaleAwarePluginCtx<
  RD,
  L,
  KA
>;

type ShellMapPlugin<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> = MapPlugin<RD, NM, ShellPluginCtx<RD, L, KA>>;

type ShellListPlugin<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> = ListPlugin<RD, NL, ShellPluginCtx<RD, L, KA>>;

type ShellMapPlugHead<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> = ResMapPlugHead<"shell", RD, KA, NM, ShellPluginCtx<RD, L, KA>>;

type ShellListPlugHead<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> = ResListPlugHead<"shell", RD, KA, NL, ShellPluginCtx<RD, L, KA>>;

interface ShellMapPlug<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> extends PlugBody<ShellMapPlugHead<RD, L, KA, NM>> {}

interface ShellListPlug<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> extends PlugBody<ShellListPlugHead<RD, L, KA, NL>> {}

export type ShellMapDefiner<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> = <R extends AnyRes>(
  factory: (plugin: ShellMapPlugin<RD, L, KA, NM>) => R | Promise<R>
) => ResMatrix<R, ShellMapPlug<RD, L, KA, NM>>;

export type ShellListDefiner<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> = <R extends AnyRes>(
  factory: (plugin: ShellListPlugin<RD, L, KA, NL>) => R | Promise<R>
) => ResMatrix<R, ShellListPlug<RD, L, KA, NL>>;
