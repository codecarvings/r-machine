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

import type { AnyLocale } from "#r-machine/locale";
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { NamespaceList, SurfaceList } from "./resource-list.js";
import type { NamespaceMap, SurfaceMap } from "./resource-map.js";
import type { AnyResource } from "./resource-origin.js";

export interface ShellPlugComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): ShellMapPlug<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): ShellListPlug<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): ShellMapPlug<RA, L, KA, NM>;
}

export interface ShellMapPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly Shell: ShellFactoryComposer;
  use(): ShellMapPlugPkg<RA, L, KA, NM>;
}

export type ShellMapPlugPkg<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: ShellPlugCtx<RA, L, KA>;
  readonly _: ShellPlugCursor;
} & SurfaceMap<RA, KA>;

interface ShellListPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly Shell: ShellFactoryComposer;
  use(): ShellListPlugPkg<RA, L, KA, NL>;
}

type ShellListPlugPkg<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...SurfaceList<RA, NL>, ShellPlugCtx<RA, L, KA>, ShellPlugCursor];

type ShellPlugCtx<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = {
  readonly locale: L;
} & (keyof KA extends never ? {} : { readonly kit: SurfaceMap<RA, KA> });

type ShellPlugCursor = {};

declare const shellFactoryBrand: unique symbol;
interface ShellFactoryBrand {
  readonly [shellFactoryBrand]: true;
}
export type ShellFactory<R extends AnyResource> = (() => R) & ShellFactoryBrand;
export type AnyShellFactory = ShellFactory<AnyResource>;

type ShellFactoryComposer = <R extends AnyResource>(factory: () => R | Promise<R>) => ShellFactory<R>;
