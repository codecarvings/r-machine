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
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextMapPlugHead<RD, L, KA, NM, NextPluginCtx<RD, L, KA, PA>>> {
  use(): Promise<NextMapPlugin<RD, L, KA, NM, PA>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsMapPlugin<RD, L, KA, NM, PA, P>>;
  use(locale: AnyLocale, bindLocale?: boolean): Promise<NextMapPlugin<RD, L, KA, NM, PA>>;
}

interface NextServerListPlug<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextListPlugHead<RD, L, KA, NL, NextPluginCtx<RD, L, KA, PA>>> {
  use(): Promise<NextListPlugin<RD, L, KA, NL, PA>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsListPlugin<RD, L, KA, NL, PA, P>>;
  use(params: AnyLocale, bindLocale?: boolean): Promise<NextListPlugin<RD, L, KA, NL, PA>>;
}

export interface NextServerPlugDefiner<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  (): NextServerMapPlug<RD, L, KA, {}, PA, LK>;
  <NL extends SolidNamespaceList<RD>>(...namespaces: NL): NextServerListPlug<RD, L, KA, NL, PA, LK>;
  <NM extends SolidNamespaceMap<RD>>(namespaces: NM): NextServerMapPlug<RD, L, KA, NM, PA, LK>;
}
