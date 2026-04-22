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

import type { AnyResAtlas, HandleMap, PlugBody, SolidHandleList, SolidHandleMap } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type {
  NextListPlugHead,
  NextListPlugin,
  NextMapPlugHead,
  NextMapPlugin,
  NextParamsListPlugin,
  NextParamsMapPlugin,
  NextPluginCtx,
} from "./next-plug.js";
import type { AnyPathAtlas } from "./path-atlas.js";

type RMachineParams<LK extends string> = {
  [P in LK]: AnyLocale;
};

interface NextServerMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends SolidHandleMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextMapPlugHead<RA, L, KM, DM, NextPluginCtx<RA, L, KM, PA>>> {
  use(): Promise<NextMapPlugin<RA, L, KM, DM, PA>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsMapPlugin<RA, L, KM, DM, PA, P>>;
  use(locale: AnyLocale, bindLocale?: boolean): Promise<NextMapPlugin<RA, L, KM, DM, PA>>;
}

interface NextServerListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends SolidHandleList<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextListPlugHead<RA, L, KM, DL, NextPluginCtx<RA, L, KM, PA>>> {
  use(): Promise<NextListPlugin<RA, L, KM, DL, PA>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsListPlugin<RA, L, KM, DL, PA, P>>;
  use(params: AnyLocale, bindLocale?: boolean): Promise<NextListPlugin<RA, L, KM, DL, PA>>;
}

export interface NextServerPlugDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  (): NextServerMapPlug<RA, L, KM, {}, PA, LK>;
  <DL extends SolidHandleList<RA>>(...deps: DL): NextServerListPlug<RA, L, KM, DL, PA, LK>;
  <DM extends SolidHandleMap<RA>>(deps: DM): NextServerMapPlug<RA, L, KM, DM, PA, LK>;
}
