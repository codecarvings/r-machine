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

import type { AnyResAtlas, NamespaceList, NamespaceMap, PlugBody } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { NextListPlugHead, NextListPlugin, NextMapPlugHead, NextMapPlugin, NextPluginCtx } from "./next-plug.js";
import type { AnyPathAtlas } from "./path-atlas.js";

interface NextClientMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextMapPlugHead<RA, L, KA, NM, NextPluginCtx<RA, L, KA, PA>>> {
  readonly use: () => NextMapPlugin<RA, L, KA, NM, PA>;
}

interface NextClientListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextListPlugHead<RA, L, KA, NL, NextPluginCtx<RA, L, KA, PA>>> {
  readonly use: () => NextListPlugin<RA, L, KA, NL, PA>;
}

export interface NextClientPlugDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
> {
  (): NextClientMapPlug<RA, L, KA, {}, PA>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): NextClientListPlug<RA, L, KA, NL, PA>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): NextClientMapPlug<RA, L, KA, NM, PA>;
}
