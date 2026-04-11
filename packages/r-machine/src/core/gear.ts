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

import type { CmdComposer } from "./cmd.js";
import type { RelayComposer } from "./relay.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList, SurfaceList } from "./res-list.js";
import type { NamespaceMap, SurfaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResListPlug, ResMapPlug } from "./res-plug.js";

export type GearCtx<RA extends AnyResAtlas, KA extends NamespaceMap<RA>> = {} & (keyof KA extends never
  ? {}
  : { readonly kit: SurfaceMap<RA, KA> });

export interface GearCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

export type GearMapPlugin<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$">> & {
  readonly $: GearCtx<RA, KA>;
} & SurfaceMap<RA, Omit<KA, keyof NM>>;

export type GearListPlugin<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> = [
  ...SurfaceList<RA, NL>,
  GearCtx<RA, KA>,
];

export type GearMapComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: GearMapPlugin<RA, KA, NM>, _: GearCursor) => R | Promise<R>
) => ResMatrix<R, ResMapPlug<RA, KA, NM>>;

export type GearListComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: GearListPlugin<RA, KA, NL>, _: GearCursor) => R | Promise<R>
) => ResMatrix<R, ResListPlug<RA, KA, NL>>;
