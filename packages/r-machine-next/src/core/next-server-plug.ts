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
  NamespaceList,
  NamespaceMap,
  PlugBody,
  SolidNamespaceList,
  SolidNamespaceMap,
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

type RMachineParams<LK extends string> = {
  [P in LK]: AnyLocale;
};

interface NextServerMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextMapPlugHead<RA, L, KA, NM, NextPluginCtx<RA, L, KA, PA>>> {
  use(): Promise<NextMapPlugin<RA, L, KA, NM, PA>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsMapPlugin<RA, L, KA, NM, PA, P>>;
  use(locale: AnyLocale, bindLocale?: boolean): Promise<NextMapPlugin<RA, L, KA, NM, PA>>;
}

interface NextServerListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextListPlugHead<RA, L, KA, NL, NextPluginCtx<RA, L, KA, PA>>> {
  use(): Promise<NextListPlugin<RA, L, KA, NL, PA>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsListPlugin<RA, L, KA, NL, PA, P>>;
  use(params: AnyLocale, bindLocale?: boolean): Promise<NextListPlugin<RA, L, KA, NL, PA>>;
}

export interface NextServerPlugDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  (): NextServerMapPlug<RA, L, KA, {}, PA, LK>;
  <NL extends SolidNamespaceList<RA>>(...namespaces: NL): NextServerListPlug<RA, L, KA, NL, PA, LK>;
  <NM extends SolidNamespaceMap<RA>>(namespaces: NM): NextServerMapPlug<RA, L, KA, NM, PA, LK>;
}
