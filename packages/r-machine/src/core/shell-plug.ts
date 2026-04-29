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

import type { Token } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { BaseGearNamespaceList } from "./base-gear-plug.js";
import type { ListPlugin, LocaleAwarePluginCtx, MapPlugin, PlugBody } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

type ShellPlugDepNamespace<RA extends AnyResAtlas, BGL extends BaseGearNamespaceList<RA>> =
  | Extract<keyof RA["shape@shell"], string>
  | BGL[number];

type ShellPlugDepHandle<RA extends AnyResAtlas, BGL extends BaseGearNamespaceList<RA>> =
  | ShellPlugDepNamespace<RA, BGL>
  | Token<ShellPlugDepNamespace<RA, BGL>>;

export type ShellPlugKitMap<RA extends AnyResAtlas, BGL extends BaseGearNamespaceList<RA> = any> = {
  readonly [k: string]: ShellPlugDepNamespace<RA, BGL>;
};

export type ShellPlugDepMap<RA extends AnyResAtlas, BGL extends BaseGearNamespaceList<RA> = any> = {
  readonly [k: string]: ShellPlugDepHandle<RA, BGL>;
};

export type ShellPlugDepList<
  RA extends AnyResAtlas,
  BGL extends BaseGearNamespaceList<RA> = any,
> = readonly ShellPlugDepHandle<RA, BGL>[];

type ShellPluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KM extends ShellPlugKitMap<RA>> = LocaleAwarePluginCtx<
  RA,
  L,
  KM
>;

export type ShellMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
> = MapPlugin<RA, DM, ShellPluginCtx<RA, L, KM>>;

export type ShellListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
> = ListPlugin<RA, DL, ShellPluginCtx<RA, L, KM>>;

type ShellMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
> = ResMapPlugHead<"shell", RA, KM, DM, ShellPluginCtx<RA, L, KM>>;

type ShellListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
> = ResListPlugHead<"shell", RA, KM, DL, ShellPluginCtx<RA, L, KM>>;

export interface ShellMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
> extends PlugBody<ShellMapPlugHead<RA, L, KM, DM>> {}

export interface ShellListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
> extends PlugBody<ShellListPlugHead<RA, L, KM, DL>> {}
