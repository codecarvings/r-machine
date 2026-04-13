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
  SurfaceList,
  SurfaceMap,
} from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { BoundPathComposer } from "./path.js";
import type { AnyPathAtlasDeclaration } from "./path-atlas.js";

interface NextPlugHead<
  M extends PlugMode,
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  CTX extends NextPluginCtx<RA, L, KA, AnyPathAtlasDeclaration>,
> extends GatePlugHead<M, RA, L, KA, NS, CTX> {}

type NextPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PAD extends AnyPathAtlasDeclaration,
> = GatePluginCtx<RA, L, KA> & {
  readonly getPath: BoundPathComposer<PAD>;
};

type NextParamsPluginCtx<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PAD extends AnyPathAtlasDeclaration,
  P extends Record<string, string>,
> = NextPluginCtx<RA, L, KA, PAD> & {
  readonly params: P;
};

interface NextClientMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PAD extends AnyPathAtlasDeclaration,
> extends PlugBody<NextPlugHead<"map", RA, L, KA, NM, NextPluginCtx<RA, L, KA, PAD>>> {
  use(): NextMapPlugin<RA, L, KA, NM, PAD>;
}

type RMachineParams<LK extends string> = {
  [P in LK]: AnyLocale;
};

interface NextServerMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PAD extends AnyPathAtlasDeclaration,
  LK extends string,
> extends PlugBody<NextPlugHead<"map", RA, L, KA, NM, NextPluginCtx<RA, L, KA, PAD>>> {
  use(): Promise<NextMapPlugin<RA, L, KA, NM, PAD>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsMapPlugin<RA, L, KA, NM, PAD, P>>;
  use(locale: AnyLocale, bindLocale?: boolean): Promise<NextMapPlugin<RA, L, KA, NM, PAD>>;
}

type NextMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PAD extends AnyPathAtlasDeclaration,
> = SurfaceMap<RA, Omit<NM, "$">> & {
  readonly $: NextPluginCtx<RA, L, KA, PAD>;
} & SurfaceMap<RA, Omit<KA, keyof NM>>;

type NextParamsMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  PAD extends AnyPathAtlasDeclaration,
  P extends Record<string, string>,
> = SurfaceMap<RA, Omit<NM, "$">> & {
  readonly $: NextParamsPluginCtx<RA, L, KA, PAD, P>;
} & SurfaceMap<RA, Omit<KA, keyof NM>>;

interface NextClientListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PAD extends AnyPathAtlasDeclaration,
> extends PlugBody<NextPlugHead<"list", RA, L, KA, NL, NextPluginCtx<RA, L, KA, PAD>>> {
  use(): NextListPlugin<RA, L, KA, NL, PAD>;
}

interface NextServerListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PAD extends AnyPathAtlasDeclaration,
  LK extends string,
> extends PlugBody<NextPlugHead<"list", RA, L, KA, NL, NextPluginCtx<RA, L, KA, PAD>>> {
  use(): Promise<NextListPlugin<RA, L, KA, NL, PAD>>;
  use<P extends RMachineParams<LK>>(
    params: Promise<P>,
    bindLocale?: boolean
  ): Promise<NextParamsListPlugin<RA, L, KA, NL, PAD, P>>;
  use(params: AnyLocale, bindLocale?: boolean): Promise<NextListPlugin<RA, L, KA, NL, PAD>>;
}

type NextListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PAD extends AnyPathAtlasDeclaration,
> = [...SurfaceList<RA, NL>, NextPluginCtx<RA, L, KA, PAD>];

type NextParamsListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  PAD extends AnyPathAtlasDeclaration,
  P extends Record<string, string>,
> = [...SurfaceList<RA, NL>, NextParamsPluginCtx<RA, L, KA, PAD, P>];

export interface NextClientPlugComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PAD extends AnyPathAtlasDeclaration,
> {
  (): NextClientMapPlug<RA, L, KA, {}, PAD>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): NextClientListPlug<RA, L, KA, NL, PAD>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): NextClientMapPlug<RA, L, KA, NM, PAD>;
}

export interface NextServerPlugComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  PAD extends AnyPathAtlasDeclaration,
  LK extends string,
> {
  (): NextServerMapPlug<RA, L, KA, {}, PAD, LK>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): NextServerListPlug<RA, L, KA, NL, PAD, LK>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): NextServerMapPlug<RA, L, KA, NM, PAD, LK>;
}
