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
  AnyResDomain,
  GateListPlugHead,
  GateMapPlugHead,
  GatePluginCtx,
  ListPlugin,
  MapPlugin,
  NamespaceList,
  NamespaceMap,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { BoundPathComposer } from "./path.js";
import type { AnyPathAtlas } from "./path-atlas.js";

export type NextPluginCtx<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  PA extends AnyPathAtlas,
> = GatePluginCtx<RD, L, KA> & {
  readonly getPath: BoundPathComposer<PA>;
};

export type NextParamsPluginCtx<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = NextPluginCtx<RD, L, KA, PA> & {
  readonly params: P;
};

export type NextMapPlugin<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  PA extends AnyPathAtlas,
> = MapPlugin<RD, NM, NextPluginCtx<RD, L, KA, PA>>;

export type NextParamsMapPlugin<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = MapPlugin<RD, NM, NextParamsPluginCtx<RD, L, KA, PA, P>>;

export type NextListPlugin<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  PA extends AnyPathAtlas,
> = ListPlugin<RD, NL, NextPluginCtx<RD, L, KA, PA>>;

export type NextParamsListPlugin<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = ListPlugin<RD, NL, NextParamsPluginCtx<RD, L, KA, PA, P>>;

export interface NextMapPlugHead<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  CTX extends NextPluginCtx<RD, L, KA, AnyPathAtlas>,
> extends GateMapPlugHead<RD, L, KA, NM, CTX> {}

export interface NextListPlugHead<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  CTX extends NextPluginCtx<RD, L, KA, AnyPathAtlas>,
> extends GateListPlugHead<RD, L, KA, NL, CTX> {}
