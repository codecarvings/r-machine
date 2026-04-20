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
  PlugBody,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";

type ReactPluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = GatePluginCtx<
  RA,
  L,
  KA
>;

type ReactMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = MapPlugin<RA, NM, ReactPluginCtx<RA, L, KA>>;

type ReactListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = ListPlugin<RA, NL, ReactPluginCtx<RA, L, KA>>;

interface ReactMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  CTX extends ReactPluginCtx<RA, L, KA>,
> extends GateMapPlugHead<RA, L, KA, NM, CTX> {}

interface ReactListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  CTX extends ReactPluginCtx<RA, L, KA>,
> extends GateListPlugHead<RA, L, KA, NL, CTX> {}

interface ReactMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> extends PlugBody<ReactMapPlugHead<RA, L, KA, NM, ReactPluginCtx<RA, L, KA>>> {
  use(): ReactMapPlugin<RA, L, KA, NM>;
}

interface ReactListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> extends PlugBody<ReactListPlugHead<RA, L, KA, NL, ReactPluginCtx<RA, L, KA>>> {
  use(): ReactListPlugin<RA, L, KA, NL>;
}

export interface ReactPlugDefiner<RA extends AnyResAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): ReactMapPlug<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): ReactListPlug<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): ReactMapPlug<RA, L, KA, NM>;
}
