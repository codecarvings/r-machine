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
  HandleList,
  HandleMap,
  NamespaceMap,
  PlugBody,
  ValidatedDepListType,
  ValidatedDepMapType,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { NextListPlugHead, NextListPlugin, NextMapPlugHead, NextMapPlugin, NextPluginCtx } from "./next-plug.js";
import type { AnyPathAtlas } from "./path-atlas.js";

export type NextClientPlugKitMap<RA extends AnyResAtlas> = NamespaceMap<RA, "valid@client:kit">;
type NextClientPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "valid@client">;
type NextClientPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "valid@client">;

interface NextClientMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends NextClientPlugKitMap<RA>,
  DM extends NextClientPlugDepMap<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextMapPlugHead<RA, L, KM, DM, NextPluginCtx<RA, L, KM, PA>>> {
  readonly useR: () => NextMapPlugin<RA, L, KM, DM, PA>;
}

interface NextClientListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends NextClientPlugKitMap<RA>,
  DL extends NextClientPlugDepList<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextListPlugHead<RA, L, KM, DL, NextPluginCtx<RA, L, KM, PA>>> {
  readonly useR: () => NextListPlugin<RA, L, KM, DL, PA>;
}

export interface NextClientPlugDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends NextClientPlugKitMap<RA>,
  PA extends AnyPathAtlas,
> {
  (): NextClientMapPlug<RA, L, KM, {}, PA>;
  <DL extends NextClientPlugDepList<RA>>(...deps: DL): ValidatedDepListType<DL, NextClientListPlug<RA, L, KM, DL, PA>>;
  <DM extends NextClientPlugDepMap<RA>>(deps: DM): ValidatedDepMapType<DM, NextClientMapPlug<RA, L, KM, DM, PA>>;
}
