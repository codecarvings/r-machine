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

import type { LocaleAwarePluginCtx } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { PlugBody, PlugHead, PlugMode } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList, SurfaceList } from "./res-list.js";
import type { NamespaceMap, SurfaceMap } from "./res-map.js";

export interface GatePlugHead<
  M extends PlugMode,
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  CTX extends GatePluginCtx<RA, L, KA>,
> extends PlugHead<"gate", M, RA, KA, NS, CTX> {}

export type GatePluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
> = LocaleAwarePluginCtx<RA, L, KA> & {
  readonly setLocale: (newLocale: L) => Promise<void>;
};

export interface GateMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> extends PlugBody<GatePlugHead<"map", RA, L, KA, NM, GatePluginCtx<RA, L, KA>>> {
  use(): GateMapPlugin<RA, L, KA, NM>;
}

export interface AsyncGateMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> extends PlugBody<GatePlugHead<"map", RA, L, KA, NM, GatePluginCtx<RA, L, KA>>> {
  use(): Promise<GateMapPlugin<RA, L, KA, NM>>;
}

export type GateMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$">> & {
  readonly $: GatePluginCtx<RA, L, KA>;
} & SurfaceMap<RA, Omit<KA, keyof NM>>;

export interface GateListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> extends PlugBody<GatePlugHead<"list", RA, L, KA, NL, GatePluginCtx<RA, L, KA>>> {
  use(): GateListPlugin<RA, L, KA, NL>;
}

export interface AsyncGateListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> extends PlugBody<GatePlugHead<"list", RA, L, KA, NL, GatePluginCtx<RA, L, KA>>> {
  use(): Promise<GateListPlugin<RA, L, KA, NL>>;
}

export type GateListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...SurfaceList<RA, NL>, GatePluginCtx<RA, L, KA>];

export interface GatePlugComposer<RA extends AnyResAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): GateMapPlug<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): GateListPlug<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): GateMapPlug<RA, L, KA, NM>;
}
