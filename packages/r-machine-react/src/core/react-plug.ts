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
  PlugBody,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";

type ReactPluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KM extends HandleMap<RA>> = GatePluginCtx<RA, L, KM>;

type ReactMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = MapPlugin<RA, DM, ReactPluginCtx<RA, L, KM>>;

type ReactListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = ListPlugin<RA, DL, ReactPluginCtx<RA, L, KM>>;

interface ReactMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends ReactPluginCtx<RA, L, KM>,
> extends GateMapPlugHead<RA, L, KM, DM, CTX> {}

interface ReactListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends ReactPluginCtx<RA, L, KM>,
> extends GateListPlugHead<RA, L, KM, DL, CTX> {}

interface ReactMapPlug<RA extends AnyResAtlas, L extends AnyLocale, KM extends HandleMap<RA>, DM extends HandleMap<RA>>
  extends PlugBody<ReactMapPlugHead<RA, L, KM, DM, ReactPluginCtx<RA, L, KM>>> {
  readonly use: () => ReactMapPlugin<RA, L, KM, DM>;
}

interface ReactListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> extends PlugBody<ReactListPlugHead<RA, L, KM, DL, ReactPluginCtx<RA, L, KM>>> {
  readonly use: () => ReactListPlugin<RA, L, KM, DL>;
}

export interface ReactPlugDefiner<RA extends AnyResAtlas, L extends AnyLocale, KM extends HandleMap<RA>> {
  (): ReactMapPlug<RA, L, KM, {}>;
  <DL extends HandleList<RA>>(...deps: DL): ReactListPlug<RA, L, KM, DL>;
  <DM extends HandleMap<RA>>(deps: DM): ReactMapPlug<RA, L, KM, DM>;
}
