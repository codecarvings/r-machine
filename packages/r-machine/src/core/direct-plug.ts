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
import type { ListPlugHead, ListPlugin, LocaleAwarePluginCtx, MapPlugHead, MapPlugin, PlugBody } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList, ValidatedDepListType } from "./res-list.js";
import type { HandleMap, NamespaceMap, ValidatedDepMapType } from "./res-map.js";

// The DirectPlug connects directly to R-Machine, without a strategy (React /
// Next) in between — the container-free, framework-neutral consumer plug. Its
// dependency scope is `valid@direct` (base gears + shells only) — exactly the
// resources whose resolution is a pure function of locale, needing no React
// context (client) nor Next request scope (server). Resolution is async and the
// locale is passed explicitly to `useR`, so it works anywhere: server
// components, client event handlers, queue workers, cron jobs, etc...
export type DirectPlugKitMap<RA extends AnyResAtlas> = NamespaceMap<RA, "valid@direct">;
type DirectPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "valid@direct">;
type DirectPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "valid@direct">;

// Context is the bare locale-aware shape: `{ kit } & { readonly locale: L }`.
// No `setLocale` (nothing to mutate — there is no bound container) and no
// `getPath`/`params` (those are Next-specific). `locale` is a readonly echo of
// the value passed to `useR`, kept for uniformity and to pass down to nested
// shells/templates.
export type DirectPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
> = LocaleAwarePluginCtx<RA, L, KM>;

export type DirectMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends DirectPlugKitMap<RA>,
  DM extends DirectPlugDepMap<RA>,
> = MapPlugin<RA, DM, DirectPluginCtx<RA, L, KM>>;

export type DirectListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends DirectPlugKitMap<RA>,
  DL extends DirectPlugDepList<RA>,
> = ListPlugin<RA, DL, DirectPluginCtx<RA, L, KM>>;

interface DirectMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends DirectPlugKitMap<RA>,
  DM extends DirectPlugDepMap<RA>,
> extends PlugBody<MapPlugHead<"gate", RA, KM, DM, DirectPluginCtx<RA, L, KM>>> {
  // Do not use L as the locale parameter type here, to allow more flexible
  // locale handling (mirrors ServerPlug.useR).
  useR(locale: AnyLocale): Promise<DirectMapPlugin<RA, L, KM, DM>>;
}

interface DirectListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends DirectPlugKitMap<RA>,
  DL extends DirectPlugDepList<RA>,
> extends PlugBody<ListPlugHead<"gate", RA, KM, DL, DirectPluginCtx<RA, L, KM>>> {
  useR(locale: AnyLocale): Promise<DirectListPlugin<RA, L, KM, DL>>;
}

export interface DirectPlugDefiner<RA extends AnyResAtlas, L extends AnyLocale, KM extends DirectPlugKitMap<RA>> {
  (): DirectMapPlug<RA, L, KM, {}>;
  <DL extends DirectPlugDepList<RA>>(...deps: DL): ValidatedDepListType<DL, DirectListPlug<RA, L, KM, DL>>;
  <DM extends DirectPlugDepMap<RA>>(deps: DM): ValidatedDepMapType<DM, DirectMapPlug<RA, L, KM, DM>>;
}
