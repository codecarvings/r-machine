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
import type { NamespaceMap, SurfaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

declare const shellSymbol: unique symbol;
export interface ShellTag {
  readonly [shellSymbol]?: typeof shellSymbol;
}

// Maps a bridgeGear tuple to a namespace-map shape suitable for SurfaceMap.
// Each tuple element becomes both the key name and the namespace reference.
type BridgeMap<BG extends readonly string[]> = {
  readonly [K in BG[number]]: K;
};

// When BG is non-empty, the shell plugin context exposes `bridge` — a record
// of surfaces, one per declared bridgeGear namespace. Empty tuples collapse
// to `{}` so no-bridge shells don't carry the field at all.
type BridgeCtx<RA extends AnyResAtlas, BG extends readonly string[]> = BG extends readonly []
  ? {}
  : { readonly bridge: SurfaceMap<RA, BridgeMap<BG> & NamespaceMap<RA>> };

type ShellPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  BG extends readonly string[],
> = LocaleAwarePluginCtx<RA, L, KA> & BridgeCtx<RA, BG>;

type ShellMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  BG extends readonly string[],
> = MapPlugin<RA, NM, ShellPluginCtx<RA, L, KA, BG>>;

type ShellListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  BG extends readonly string[],
> = ListPlugin<RA, NL, ShellPluginCtx<RA, L, KA, BG>>;

type ShellMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  BG extends readonly string[],
> = ResMapPlugHead<"shell", RA, KA, NM, ShellPluginCtx<RA, L, KA, BG>>;

type ShellListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  BG extends readonly string[],
> = ResListPlugHead<"shell", RA, KA, NL, ShellPluginCtx<RA, L, KA, BG>>;

interface ShellMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  BG extends readonly string[],
> extends PlugBody<ShellMapPlugHead<RA, L, KA, NM, BG>> {}

interface ShellListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  BG extends readonly string[],
> extends PlugBody<ShellListPlugHead<RA, L, KA, NL, BG>> {}

export type ShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  BG extends readonly string[],
> = <R extends AnyRes>(
  factory: (plugin: ShellMapPlugin<RA, L, KA, NM, BG>) => R | Promise<R>
) => ResMatrix<R & ShellTag, ShellMapPlug<RA, L, KA, NM, BG>>;

export type ShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  BG extends readonly string[],
> = <R extends AnyRes>(
  factory: (plugin: ShellListPlugin<RA, L, KA, NL, BG>) => R | Promise<R>
) => ResMatrix<R & ShellTag, ShellListPlug<RA, L, KA, NL, BG>>;
