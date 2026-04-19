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

import type { RMachineTypeError } from "#r-machine/errors";
import type { GearListDefiner, GearMapDefiner, GearTag } from "./gear.js";
import type { ReactiveGearListDepsComposer, ReactiveGearMapDepsComposer } from "./reactive-gear-composer.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceRef } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { VertexGearTag } from "./vertex-gear.js";

type ValidGearDepItem<RA extends AnyResAtlas, N> =
  N extends NamespaceRef<RA["gear"]>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid gear namespace.`>
      : RMachineTypeError<"This token does not reference a valid gear namespace.">;

export interface GearComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  T extends GearTag | VertexGearTag = GearTag,
> {
  readonly deps: GearDepsComposer<RA, KA, T>;
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, {}, T>;
  readonly define: GearMapDefiner<RA["res"], KA, {}, T>;
}

interface GearDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  T extends GearTag | VertexGearTag,
> {
  (): GearMapDepsComposer<RA, KA, {}, T>;
  <const NL extends readonly NamespaceRef<RA["res"]>[]>(
    ...namespaces: { readonly [I in keyof NL]: ValidGearDepItem<RA, NL[I]> }
  ): GearListDepsComposer<RA, KA, NL, T>;
  <const NM extends { readonly [k: string]: NamespaceRef<RA["res"]> }>(
    namespaces: { readonly [K in keyof NM]: ValidGearDepItem<RA, NM[K]> }
  ): GearMapDepsComposer<RA, KA, NM, T>;
}

interface GearMapDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  T,
> {
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, NM, T>;
  readonly define: GearMapDefiner<RA["res"], KA, NM, T>;
}

interface GearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  T,
> {
  readonly reactive: ReactiveGearListDepsComposer<RA, KA, NL, T>;
  readonly define: GearListDefiner<RA["res"], KA, NL, T>;
}
