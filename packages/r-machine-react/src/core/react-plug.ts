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

import type {
  AnyResAtlas,
  GateListPlugHead,
  GateMapPlugHead,
  GatePluginCtx,
  HandleList,
  HandleMap,
  ListPlugin,
  MapPlugin,
  NamespaceMap,
  PlugBody,
  ValidatedDepListType,
  ValidatedDepMapType,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";

export type ReactPlugKitMap<RA extends AnyResAtlas> = NamespaceMap<RA, "valid@client:kit">;
type ReactPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "valid@client">;
type ReactPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "valid@client">;

type ReactPluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KM extends ReactPlugKitMap<RA>> = GatePluginCtx<
  RA,
  L,
  KM
>;

type ReactMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ReactPlugKitMap<RA>,
  DM extends ReactPlugDepMap<RA>,
> = MapPlugin<RA, DM, ReactPluginCtx<RA, L, KM>>;

type ReactListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ReactPlugKitMap<RA>,
  DL extends ReactPlugDepList<RA>,
> = ListPlugin<RA, DL, ReactPluginCtx<RA, L, KM>>;

interface ReactMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ReactPlugKitMap<RA>,
  DM extends ReactPlugDepMap<RA>,
  CTX extends ReactPluginCtx<RA, L, KM>,
> extends GateMapPlugHead<RA, L, KM, DM, CTX> {}

interface ReactListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ReactPlugKitMap<RA>,
  DL extends ReactPlugDepList<RA>,
  CTX extends ReactPluginCtx<RA, L, KM>,
> extends GateListPlugHead<RA, L, KM, DL, CTX> {}

interface ReactMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ReactPlugKitMap<RA>,
  DM extends ReactPlugDepMap<RA>,
> extends PlugBody<ReactMapPlugHead<RA, L, KM, DM, ReactPluginCtx<RA, L, KM>>> {
  readonly use: () => ReactMapPlugin<RA, L, KM, DM>;
}

interface ReactListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ReactPlugKitMap<RA>,
  DL extends ReactPlugDepList<RA>,
> extends PlugBody<ReactListPlugHead<RA, L, KM, DL, ReactPluginCtx<RA, L, KM>>> {
  readonly use: () => ReactListPlugin<RA, L, KM, DL>;
}

export interface ReactPlugDefiner<RA extends AnyResAtlas, L extends AnyLocale, KM extends ReactPlugKitMap<RA>> {
  (): ReactMapPlug<RA, L, KM, {}>;
  <DL extends ReactPlugDepList<RA>>(...deps: DL): ValidatedDepListType<DL, ReactListPlug<RA, L, KM, DL>>;
  <DM extends ReactPlugDepMap<RA>>(deps: DM): ValidatedDepMapType<DM, ReactMapPlug<RA, L, KM, DM>>;
}
