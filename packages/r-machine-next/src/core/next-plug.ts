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
  ListPlugin,
  MapPlugin,
  NamespaceList,
  NamespaceMap,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { BoundPathComposer } from "./path.js";
import type { AnyPathAtlas } from "./path-atlas.js";

export type NextPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
> = GatePluginCtx<RA, L, KA> & {
  readonly getPath: BoundPathComposer<PA>;
};

export type NextParamsPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = NextPluginCtx<RA, L, KA, PA> & {
  readonly params: P;
};

export type NextMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
> = MapPlugin<RA, NM, NextPluginCtx<RA, L, KA, PA>>;

export type NextParamsMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = MapPlugin<RA, NM, NextParamsPluginCtx<RA, L, KA, PA, P>>;

export type NextListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PA extends AnyPathAtlas,
> = ListPlugin<RA, NL, NextPluginCtx<RA, L, KA, PA>>;

export type NextParamsListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = ListPlugin<RA, NL, NextParamsPluginCtx<RA, L, KA, PA, P>>;

export interface NextMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  CTX extends NextPluginCtx<RA, L, KA, AnyPathAtlas>,
> extends GateMapPlugHead<RA, L, KA, NM, CTX> {}

export interface NextListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  CTX extends NextPluginCtx<RA, L, KA, AnyPathAtlas>,
> extends GateListPlugHead<RA, L, KA, NL, CTX> {}
