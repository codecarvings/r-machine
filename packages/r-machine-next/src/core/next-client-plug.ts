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

import type { AnyResAtlas, HandleList, HandleMap, PlugBody } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { NextListPlugHead, NextListPlugin, NextMapPlugHead, NextMapPlugin, NextPluginCtx } from "./next-plug.js";
import type { AnyPathAtlas } from "./path-atlas.js";

interface NextClientMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextMapPlugHead<RA, L, KM, DM, NextPluginCtx<RA, L, KM, PA>>> {
  readonly use: () => NextMapPlugin<RA, L, KM, DM, PA>;
}

interface NextClientListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextListPlugHead<RA, L, KM, DL, NextPluginCtx<RA, L, KM, PA>>> {
  readonly use: () => NextListPlugin<RA, L, KM, DL, PA>;
}

export interface NextClientPlugDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  PA extends AnyPathAtlas,
> {
  (): NextClientMapPlug<RA, L, KM, {}, PA>;
  <DL extends HandleList<RA>>(...deps: DL): NextClientListPlug<RA, L, KM, DL, PA>;
  <DM extends HandleMap<RA>>(deps: DM): NextClientMapPlug<RA, L, KM, DM, PA>;
}
