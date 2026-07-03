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
import type { AnyResAtlas, ResAtlasCatalog } from "./res-atlas.js";
import {
  type ExtractNamespace,
  getNamespace,
  type Handle,
  type Namespace,
  type ShellPickerHandle,
} from "./res-domain.js";
import type { Surface } from "./surface.js";

export type HandleMap<RA extends AnyResAtlas, C extends ResAtlasCatalog = "shape"> = {
  readonly [k: string]: Handle<RA[C]>;
};

// `withDeps` catalog for GEARS: a normal handle from catalog `C`, OR a
// `res.perLocale(...)`. The shell picker's namespace is typed as the CHEAP full-shape union
// `Namespace<RA["shape"]>` (= keyof the raw domain, already cached everywhere)
// rather than the mapped-over-RD `Namespace<RA["shape@shell"]>` — the latter
// forced a costly shell-shape materialization on every `withDeps({…})`
// completion. The shell restriction is enforced upstream at the `res.perLocale(...)`
// builder (`ShellPickerBuilder<RA["shape@shell"]>`); the catalog only needs to ADMIT
// a shell picker, and the specific `ShellPickerHandle<"shell/x">` is preserved via const
// inference and read back by DepSurfaceMap. Materialized at the
// composer-parameter level (never on the ResAtlas interface) to avoid the
// ResAtlas member perf trap.
export type DepHandleMap<RA extends AnyResAtlas, C extends ResAtlasCatalog = "shape"> = {
  readonly [k: string]: Handle<RA[C]> | ShellPickerHandle<Namespace<RA["shape"]>>;
};

export type NamespaceMap<RA extends AnyResAtlas, C extends ResAtlasCatalog = "shape"> = {
  readonly [k: string]: Namespace<RA[C]>;
};
export type AnyNamespaceMap = NamespaceMap<AnyResAtlas>;
export interface AnyResolvedNamespaceMap {
  readonly [k: string]: unknown;
}

// Utility type to check if a HandleMap is widened (wrong namespace is passed)
export type IsWidenedMap<M> = string extends keyof M ? true : false;

export type ValidatedDepMapType<DM, T> =
  IsWidenedMap<DM> extends true ? RMachineTypeError<"Invalid dependency map provided."> : T;

export function getNamespaceMap<RA extends AnyResAtlas>(handles: HandleMap<RA>): NamespaceMap<RA> {
  const result: any = {};
  for (const k in handles) {
    result[k] = getNamespace(handles[k]);
  }
  return result as NamespaceMap<RA>;
}

// -readonly as SurfaceList
export type SurfaceMap<RA extends AnyResAtlas, HM extends HandleMap<RA>> = {
  -readonly [K in keyof HM]: Surface<
    RA["shape"][ExtractNamespace<HM[K]>],
    ExtractNamespace<HM[K]>,
    RA["let"][ExtractNamespace<HM[K]>]
  >;
};

// Dep-facing variant of SurfaceMap: identical, except a `ShellPickerHandle<S>` (a
// shell declared as a dep) resolves to a locale-parametric LOADER
// `(locale) => Promise<Surface>` instead of a plain Surface. Kept SEPARATE from
// SurfaceMap so the equipment kit (which also uses SurfaceMap) is unaffected.
export type DepSurfaceMap<RA extends AnyResAtlas, HM extends HandleMap<RA>> = {
  -readonly [K in keyof HM]: HM[K] extends ShellPickerHandle<infer S extends string, infer L>
    ? (locale: L) => Promise<Surface<RA["shape"][S], S, RA["let"][S]>>
    : Surface<RA["shape"][ExtractNamespace<HM[K]>], ExtractNamespace<HM[K]>, RA["let"][ExtractNamespace<HM[K]>]>;
};
