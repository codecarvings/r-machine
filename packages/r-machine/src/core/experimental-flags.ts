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

/**
 * Opt-in flags for features whose public API may still change incompatibly.
 *
 * **No flag is active right now.** The `never`-valued index signature is what
 * makes that statement enforceable: a retired (or misspelled) flag fails to
 * compile instead of being silently frozen into the config and ignored.
 *
 * A flag is (re-)introduced by replacing the index signature with the declared
 * keys, e.g. the retired `outerGear` gate — `OuterGear` / `VertexFrame` were
 * withheld from the toolsets until it was set — read:
 *
 * ```ts
 * export interface ExperimentalFlags {
 *   outerGear?: "on";
 * }
 * ```
 *
 * ...paired with an `ExperimentalTools` conditional at each toolset (see below).
 */
export interface ExperimentalFlags {
  readonly [flag: string]: never;
}

/**
 * The type-level seam every toolset intersects with, so that a flag adds tools
 * to the surface it belongs to.
 *
 * With no flag declared it resolves to `{}` and contributes nothing —
 * `T & ExperimentalTools<EF>` is type-identical to `T`, so toolset shape
 * assertions stay exact. Its purpose meanwhile is to keep each toolset's `EF`
 * type parameter live (`noUnusedParameters` rejects an orphaned one), so that
 * re-gating a future feature stays a local edit at the toolset instead of
 * re-threading `EF` through three packages.
 *
 * `Pick<EF, never>` rather than a conditional: a conditional over a still-generic
 * `EF` stays deferred, and the toolset factories — which build their object with
 * `EF` unresolved — then fail to type-check against it. The mapped type resolves
 * to `{}` eagerly. A real flag reintroduces the conditional form, which is fine
 * because both of its branches are object types.
 */
export type ExperimentalTools<EF extends ExperimentalFlags> = Pick<EF, never>;
