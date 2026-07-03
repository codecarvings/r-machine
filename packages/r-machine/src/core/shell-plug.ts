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

import type { Namespace, ShellPickerHandle, Token } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { BaseGearNamespaceList } from "./base-gear-plug.js";
import type { ListPlugin, MapPlugin, PlugBody } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { AnyPortMap, ResListPlugHead, ResMapPlugHead, ResPluginCtx } from "./res-plug.js";

type ShellPlugDepNamespace<RA extends AnyResAtlas, BGL extends BaseGearNamespaceList<RA>> =
  | Extract<keyof RA["shape@shell"], string>
  | BGL[number];

// A shell dep is a shell/bridge-gear handle, OR a `res.perLocale(...)` shell
// picker — letting a shell resolve ANOTHER locale's content on demand
// (`(locale) => Promise<Surface>`), not just its own ambient locale. Same
// mechanism as gears; the shell restriction is enforced at the `res.perLocale`
// builder (`ShellPickerBuilder<RA["shape@shell"]>`), so the catalog admits the
// cheap `ShellPickerHandle<Namespace<RA["shape"]>>` (see DepHandleMap).
type ShellPlugDepHandle<RA extends AnyResAtlas, BGL extends BaseGearNamespaceList<RA>> =
  | ShellPlugDepNamespace<RA, BGL>
  | Token<ShellPlugDepNamespace<RA, BGL>>
  | ShellPickerHandle<Namespace<RA["shape"]>>;

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

export type ShellPlugPortMap = AnyPortMap;

export type ShellPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  PM extends ShellPlugPortMap,
> = ResPluginCtx<RA, KM, PM> & { readonly locale: L };

export type ShellMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
  PM extends ShellPlugPortMap,
> = MapPlugin<RA, DM, ShellPluginCtx<RA, L, KM, PM>>;

export type ShellListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
  PM extends ShellPlugPortMap,
> = ListPlugin<RA, DL, ShellPluginCtx<RA, L, KM, PM>>;

type ShellMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
  PM extends ShellPlugPortMap,
> = ResMapPlugHead<"shell", RA, KM, DM, PM, ShellPluginCtx<RA, L, KM, PM>>;

type ShellListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
  PM extends ShellPlugPortMap,
> = ResListPlugHead<"shell", RA, KM, DL, PM, ShellPluginCtx<RA, L, KM, PM>>;

export interface ShellMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
  PM extends ShellPlugPortMap,
> extends PlugBody<ShellMapPlugHead<RA, L, KM, DM, PM>> {}

export interface ShellListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
  PM extends ShellPlugPortMap,
> extends PlugBody<ShellListPlugHead<RA, L, KM, DL, PM>> {}
