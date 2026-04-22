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
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextMapPlugHead<RA, L, KA, DM, NextPluginCtx<RA, L, KA, PA>>> {
  readonly use: () => NextMapPlugin<RA, L, KA, DM, PA>;
}

interface NextClientListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextListPlugHead<RA, L, KA, DL, NextPluginCtx<RA, L, KA, PA>>> {
  readonly use: () => NextListPlugin<RA, L, KA, DL, PA>;
}

export interface NextClientPlugDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  PA extends AnyPathAtlas,
> {
  (): NextClientMapPlug<RA, L, KA, {}, PA>;
  <DL extends HandleList<RA>>(...deps: DL): NextClientListPlug<RA, L, KA, DL, PA>;
  <DM extends HandleMap<RA>>(deps: DM): NextClientMapPlug<RA, L, KA, DM, PA>;
}
