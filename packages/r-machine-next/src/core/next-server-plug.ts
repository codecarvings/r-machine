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

export type NextServerPlugKitMap<RA extends AnyResAtlas> = NamespaceMap<RA, "valid@server">;
type NextServerPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "valid@server">;
type NextServerPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "valid@server">;

type RMachineParams<LK extends string> = {
  [P in LK]: AnyLocale;
};

interface NextServerMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends NextServerPlugKitMap<RA>,
  DM extends NextServerPlugDepMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextMapPlugHead<RA, L, KM, DM, NextPluginCtx<RA, L, KM, PA>>> {
  useR(): Promise<NextMapPlugin<RA, L, KM, DM, PA>>;
  useR<P extends RMachineParams<LK>>(params: Promise<P>): Promise<NextParamsMapPlugin<RA, L, KM, DM, PA, P>>;
  useR(locale: AnyLocale): Promise<NextMapPlugin<RA, L, KM, DM, PA>>; // Do not use L as locale type here, to allow more flexible locale handling
  useUnboundR<P extends RMachineParams<LK>>(params: Promise<P>): Promise<NextParamsMapPlugin<RA, L, KM, DM, PA, P>>;
  useUnboundR(locale: AnyLocale): Promise<NextMapPlugin<RA, L, KM, DM, PA>>; // Do not use L as locale type here, to allow more flexible locale handling
}

interface NextServerListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends NextServerPlugKitMap<RA>,
  DL extends NextServerPlugDepList<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextListPlugHead<RA, L, KM, DL, NextPluginCtx<RA, L, KM, PA>>> {
  useR(): Promise<NextListPlugin<RA, L, KM, DL, PA>>;
  useR<P extends RMachineParams<LK>>(params: Promise<P>): Promise<NextParamsListPlugin<RA, L, KM, DL, PA, P>>;
  useR(locale: AnyLocale): Promise<NextListPlugin<RA, L, KM, DL, PA>>; // Do not use L as locale type here, to allow more flexible locale handling
  useUnboundR<P extends RMachineParams<LK>>(params: Promise<P>): Promise<NextParamsListPlugin<RA, L, KM, DL, PA, P>>;
  useUnboundR(locale: AnyLocale): Promise<NextListPlugin<RA, L, KM, DL, PA>>; // Do not use L as locale type here, to allow more flexible locale handling
}

export interface NextServerPlugDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  (): NextServerMapPlug<RA, L, KM, {}, PA, LK>;
  <DL extends NextServerPlugDepList<RA>>(
    ...deps: DL
  ): ValidatedDepListType<DL, NextServerListPlug<RA, L, KM, DL, PA, LK>>;
  <DM extends NextServerPlugDepMap<RA>>(deps: DM): ValidatedDepMapType<DM, NextServerMapPlug<RA, L, KM, DM, PA, LK>>;
}
