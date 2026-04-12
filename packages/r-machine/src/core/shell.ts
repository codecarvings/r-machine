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
import type { GearCtx } from "./gear.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList, SurfaceList } from "./res-list.js";
import type { NamespaceMap, SurfaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlug, ResMapPlug } from "./res-plug.js";

type ShellCtx<RA extends AnyResAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = GearCtx<RA, KA> & {
  readonly locale: L;
};

interface ShellMapPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> extends ResMapPlug<RA, KA, NM, ShellMapPlugin<RA, L, KA, NM>> {}

type ShellMapPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$">> & {
  readonly $: ShellCtx<RA, L, KA>;
} & SurfaceMap<RA, Omit<KA, keyof NM>>;

interface ShellListPlug<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> extends ResListPlug<RA, KA, NL, ShellListPlugin<RA, L, KA, NL>> {}

type ShellListPlugin<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...SurfaceList<RA, NL>, ShellCtx<RA, L, KA>];

export type ShellMapComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = <R extends AnyRes>(
  factory: (plugin: ShellMapPlugin<RA, L, KA, NM>) => R | Promise<R>
) => ResMatrix<R, ShellMapPlug<RA, L, KA, NM>>;

export type ShellListComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = <R extends AnyRes>(
  factory: (plugin: ShellListPlugin<RA, L, KA, NL>) => R | Promise<R>
) => ResMatrix<R, ShellListPlug<RA, L, KA, NL>>;
