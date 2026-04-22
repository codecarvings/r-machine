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
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

type ShellPluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KM extends HandleMap<RA>> = LocaleAwarePluginCtx<
  RA,
  L,
  KM
>;

type ShellMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = MapPlugin<RA, DM, ShellPluginCtx<RA, L, KM>>;

type ShellListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = ListPlugin<RA, DL, ShellPluginCtx<RA, L, KM>>;

type ShellMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = ResMapPlugHead<"shell", RA, KM, DM, ShellPluginCtx<RA, L, KM>>;

type ShellListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = ResListPlugHead<"shell", RA, KM, DL, ShellPluginCtx<RA, L, KM>>;

interface ShellMapPlug<RA extends AnyResAtlas, L extends AnyLocale, KM extends HandleMap<RA>, DM extends HandleMap<RA>>
  extends PlugBody<ShellMapPlugHead<RA, L, KM, DM>> {}

interface ShellListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> extends PlugBody<ShellListPlugHead<RA, L, KM, DL>> {}

export type ShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = <R extends AnyRes>(
  factory: (plugin: ShellMapPlugin<RA, L, KM, DM>) => R | Promise<R>
) => ResMatrix<R, ShellMapPlug<RA, L, KM, DM>>;

export type ShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = <R extends AnyRes>(
  factory: (plugin: ShellListPlugin<RA, L, KM, DL>) => R | Promise<R>
) => ResMatrix<R, ShellListPlug<RA, L, KM, DL>>;
