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
  GatePlugHead,
  GatePluginCtx,
  NamespaceList,
  NamespaceMap,
  PlugBody,
  PlugMode,
  SolidNamespaceList,
  SolidNamespaceMap,
  SurfaceList,
  SurfaceMap,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { BoundPathComposer } from "./path.js";
import type { AnyPathAtlas } from "./path-atlas.js";

interface NextPlugHead<
  M extends PlugMode,
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  CTX extends NextPluginCtx<RA, L, KA, AnyPathAtlas>,
> extends GatePlugHead<M, RA, L, KA, NS, CTX> {}

type NextPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
> = GatePluginCtx<RA, L, KA> & {
  readonly getPath: BoundPathComposer<PA>;
};

type NextParamsPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = NextPluginCtx<RA, L, KA, PA> & {
  readonly params: P;
};

interface NextClientMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextPlugHead<"map", RA, L, KA, NM, NextPluginCtx<RA, L, KA, PA>>> {
  use(): NextMapPlugin<RA, L, KA, NM, PA>;
}

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
> extends PlugBody<NextPlugHead<"map", RA, L, KA, NM, NextPluginCtx<RA, L, KA, PA>>> {
  use(): Promise<NextMapPlugin<RA, L, KA, NM, PA>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsMapPlugin<RA, L, KA, NM, PA, P>>;
  use(locale: AnyLocale, bindLocale?: boolean): Promise<NextMapPlugin<RA, L, KA, NM, PA>>;
}

type NextMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
> = SurfaceMap<RA, Omit<NM, "$">> & {
  readonly $: NextPluginCtx<RA, L, KA, PA>;
} & SurfaceMap<RA, Omit<KA, keyof NM>>;

type NextParamsMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = SurfaceMap<RA, Omit<NM, "$">> & {
  readonly $: NextParamsPluginCtx<RA, L, KA, PA, P>;
} & SurfaceMap<RA, Omit<KA, keyof NM>>;

interface NextClientListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PA extends AnyPathAtlas,
> extends PlugBody<NextPlugHead<"list", RA, L, KA, NL, NextPluginCtx<RA, L, KA, PA>>> {
  use(): NextListPlugin<RA, L, KA, NL, PA>;
}

interface NextServerListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PlugBody<NextPlugHead<"list", RA, L, KA, NL, NextPluginCtx<RA, L, KA, PA>>> {
  use(): Promise<NextListPlugin<RA, L, KA, NL, PA>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsListPlugin<RA, L, KA, NL, PA, P>>;
  use(params: AnyLocale, bindLocale?: boolean): Promise<NextListPlugin<RA, L, KA, NL, PA>>;
}

type NextListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PA extends AnyPathAtlas,
> = [...SurfaceList<RA, NL>, NextPluginCtx<RA, L, KA, PA>];

type NextParamsListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PA extends AnyPathAtlas,
  P extends Record<string, string>,
> = [...SurfaceList<RA, NL>, NextParamsPluginCtx<RA, L, KA, PA, P>];

export interface NextClientPlugComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PA extends AnyPathAtlas,
> {
  (): NextClientMapPlug<RA, L, KA, {}, PA>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): NextClientListPlug<RA, L, KA, NL, PA>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): NextClientMapPlug<RA, L, KA, NM, PA>;
}

export interface NextServerPlugComposer<
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
