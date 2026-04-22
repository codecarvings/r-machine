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
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { BoundPathComposer } from "./path.js";
import type { AnyPathAtlas } from "./path-atlas.js";

export type NextPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  PA extends AnyPathAtlas,
> = GatePluginCtx<RA, L, KM> & {
  readonly getPath: BoundPathComposer<PA>;
};

export type NextParamsPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = NextPluginCtx<RA, L, KM, PA> & {
  readonly params: P;
};

export type NextMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  PA extends AnyPathAtlas,
> = MapPlugin<RA, DM, NextPluginCtx<RA, L, KM, PA>>;

export type NextParamsMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = MapPlugin<RA, DM, NextParamsPluginCtx<RA, L, KM, PA, P>>;

export type NextListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  PA extends AnyPathAtlas,
> = ListPlugin<RA, DL, NextPluginCtx<RA, L, KM, PA>>;

export type NextParamsListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = ListPlugin<RA, DL, NextParamsPluginCtx<RA, L, KM, PA, P>>;

export interface NextMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends NextPluginCtx<RA, L, KM, AnyPathAtlas>,
> extends GateMapPlugHead<RA, L, KM, DM, CTX> {}

export interface NextListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends NextPluginCtx<RA, L, KM, AnyPathAtlas>,
> extends GateListPlugHead<RA, L, KM, DL, CTX> {}
