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

type ReactPluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KA extends HandleMap<RA>> = GatePluginCtx<RA, L, KA>;

type ReactMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> = MapPlugin<RA, DM, ReactPluginCtx<RA, L, KA>>;

type ReactListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
> = ListPlugin<RA, DL, ReactPluginCtx<RA, L, KA>>;

interface ReactMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends ReactPluginCtx<RA, L, KA>,
> extends GateMapPlugHead<RA, L, KA, DM, CTX> {}

interface ReactListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends ReactPluginCtx<RA, L, KA>,
> extends GateListPlugHead<RA, L, KA, DL, CTX> {}

interface ReactMapPlug<RA extends AnyResAtlas, L extends AnyLocale, KA extends HandleMap<RA>, DM extends HandleMap<RA>>
  extends PlugBody<ReactMapPlugHead<RA, L, KA, DM, ReactPluginCtx<RA, L, KA>>> {
  readonly use: () => ReactMapPlugin<RA, L, KA, DM>;
}

interface ReactListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
> extends PlugBody<ReactListPlugHead<RA, L, KA, DL, ReactPluginCtx<RA, L, KA>>> {
  readonly use: () => ReactListPlugin<RA, L, KA, DL>;
}

export interface ReactPlugDefiner<RA extends AnyResAtlas, L extends AnyLocale, KA extends HandleMap<RA>> {
  (): ReactMapPlug<RA, L, KA, {}>;
  <DL extends HandleList<RA>>(...deps: DL): ReactListPlug<RA, L, KA, DL>;
  <DM extends HandleMap<RA>>(deps: DM): ReactMapPlug<RA, L, KA, DM>;
}
