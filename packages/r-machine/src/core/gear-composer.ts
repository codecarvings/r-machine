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
import type { AnyResAtlas, AnyResAtlasInstance, NamespaceRef } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { VertexGearTag } from "./vertex-gear.js";

// Validator for a single `.deps(...)` item. If N is a gear namespace ref
// (string or token), pass it through; otherwise produce a branded error
// whose message surfaces inline in the TS diagnostic. The string-only
// arm produces the nice template-literal message; non-string invalid
// inputs (e.g. non-gear tokens) get a generic message.
type ValidGearDepItem<ATLAS extends AnyResAtlasInstance, N> =
  N extends NamespaceRef<ATLAS["gear"]>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid gear namespace.`>
      : RMachineTypeError<"This token does not reference a valid gear namespace.">;

// The composer operates on the full atlas instance (ATLAS) so `.deps(...)`
// can restrict the accepted namespaces to the `gear` sub-map only. Surface
// resolution and plugin typing still happen against ATLAS["res"] — we only
// narrow the keyset accepted by `.deps(...)`. This filter excludes
// vertex-gear namespaces for both GearTag and VertexGearTag composers: by
// design vertex gears cannot be used as dependencies.
export interface GearComposer<
  ATLAS extends AnyResAtlasInstance,
  KA extends NamespaceMap<ATLAS["res"]>,
  T extends GearTag | VertexGearTag = GearTag,
> {
  readonly deps: GearDepsComposer<ATLAS, KA, T>;
  readonly reactive: ReactiveGearMapDepsComposer<ATLAS["res"], KA, {}, T>;
  readonly define: GearMapDefiner<ATLAS["res"], KA, {}, T>;
}

// Deps accept gear namespaces only (keys of ATLAS["gear"]), passed either
// as a rest list or a name-to-namespace map. The generic is widened to the
// full res-namespace set; per-item validation via ValidGearDepItem produces
// a branded diagnostic when the caller passes a non-gear namespace.
// Autocomplete on `.deps("` still surfaces only gear prefixes thanks to
// NamespaceRef<ATLAS["gear"]> being the valid-arm output.
interface GearDepsComposer<
  ATLAS extends AnyResAtlasInstance,
  KA extends NamespaceMap<ATLAS["res"]>,
  T extends GearTag | VertexGearTag,
> {
  (): GearMapDepsComposer<ATLAS["res"], KA, {}, T>;
  <const NL extends readonly NamespaceRef<ATLAS["res"]>[]>(
    ...namespaces: { readonly [I in keyof NL]: ValidGearDepItem<ATLAS, NL[I]> }
  ): GearListDepsComposer<ATLAS["res"], KA, NL, T>;
  <const NM extends { readonly [k: string]: NamespaceRef<ATLAS["res"]> }>(
    namespaces: { readonly [K in keyof NM]: ValidGearDepItem<ATLAS, NM[K]> }
  ): GearMapDepsComposer<ATLAS["res"], KA, NM, T>;
}

interface GearMapDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>, T> {
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, NM, T>;
  readonly define: GearMapDefiner<RA, KA, NM, T>;
}

interface GearListDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>, T> {
  readonly reactive: ReactiveGearListDepsComposer<RA, KA, NL, T>;
  readonly define: GearListDefiner<RA, KA, NL, T>;
}
