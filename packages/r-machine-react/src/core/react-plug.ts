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
  PlugBody,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";

type ReactPluginCtx<RD extends AnyResDomain, L extends AnyLocale, KA extends NamespaceMap<RD>> = GatePluginCtx<
  RD,
  L,
  KA
>;

type ReactMapPlugin<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> = MapPlugin<RD, NM, ReactPluginCtx<RD, L, KA>>;

type ReactListPlugin<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> = ListPlugin<RD, NL, ReactPluginCtx<RD, L, KA>>;

interface ReactMapPlugHead<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  CTX extends ReactPluginCtx<RD, L, KA>,
> extends GateMapPlugHead<RD, L, KA, NM, CTX> {}

interface ReactListPlugHead<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  CTX extends ReactPluginCtx<RD, L, KA>,
> extends GateListPlugHead<RD, L, KA, NL, CTX> {}

interface ReactMapPlug<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
> extends PlugBody<ReactMapPlugHead<RD, L, KA, NM, ReactPluginCtx<RD, L, KA>>> {
  use(): ReactMapPlugin<RD, L, KA, NM>;
}

interface ReactListPlug<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
> extends PlugBody<ReactListPlugHead<RD, L, KA, NL, ReactPluginCtx<RD, L, KA>>> {
  use(): ReactListPlugin<RD, L, KA, NL>;
}

export interface ReactPlugDefiner<RD extends AnyResDomain, L extends AnyLocale, KA extends NamespaceMap<RD>> {
  (): ReactMapPlug<RD, L, KA, {}>;
  <NL extends NamespaceList<RD>>(...namespaces: NL): ReactListPlug<RD, L, KA, NL>;
  <NM extends NamespaceMap<RD>>(namespaces: NM): ReactMapPlug<RD, L, KA, NM>;
}
