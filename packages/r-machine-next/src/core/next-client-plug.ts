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

import type { AnyResDomain, NamespaceList, NamespaceMap, PlugBody } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { NextListPlugHead, NextListPlugin, NextMapPlugHead, NextMapPlugin, NextPluginCtx } from "./next-plug.js";
import type { AnyPathAtlas } from "./path-atlas.js";

interface NextClientMapPlug<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextMapPlugHead<RD, L, KA, NM, NextPluginCtx<RD, L, KA, PA>>> {
  use(): NextMapPlugin<RD, L, KA, NM, PA>;
}

interface NextClientListPlug<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextListPlugHead<RD, L, KA, NL, NextPluginCtx<RD, L, KA, PA>>> {
  use(): NextListPlugin<RD, L, KA, NL, PA>;
}

export interface NextClientPlugDefiner<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  PA extends AnyPathAtlas,
> {
  (): NextClientMapPlug<RD, L, KA, {}, PA>;
  <NL extends NamespaceList<RD>>(...namespaces: NL): NextClientListPlug<RD, L, KA, NL, PA>;
  <NM extends NamespaceMap<RD>>(namespaces: NM): NextClientMapPlug<RD, L, KA, NM, PA>;
}
