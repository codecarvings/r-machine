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

import type { BlueprintManager } from "./blueprint-manager.js";
import type { RegisteredRelay, RelayOrderingProvider, RelayRuntime } from "./cassette-recorder.js";

/**
 * Builds the relay ordering provider used at runtime to flush dirty relays.
 *
 * Ordering rules (deterministic):
 *   1. **Depth** (primary, ascending): for each relay R hosted in namespace
 *      N(R), depth = min distance from any mutation source to N(R) in the
 *      reverseDeps graph. Sources are the namespaces of the OGs whose
 *      actions mutated state during the transaction. Relays whose hosting
 *      namespace is itself a source have depth 0 (fired first).
 *   2. **Priority** (tie-break, ascending): the ResourceAtlas-declared
 *      priority index (lower = higher priority). Namespaces absent from
 *      the atlas priority list compare as +Infinity (lowest priority).
 *   3. **Registration order** (final tie-break, ascending): preserves a
 *      stable FIFO for relays that are siblings at the same depth +
 *      priority.
 *
 * Relays with no hosting namespace (e.g., relays registered outside a
 * cursor in tests) get depth = +Infinity and fall back to priority +
 * registration order — they fire AFTER everything namespace-aware.
 */
export function createBlueprintRelayOrderingProvider(bpm: BlueprintManager): RelayOrderingProvider {
  return {
    order(dirtyRelays, sources, fullList) {
      const depths = bpm.reverseBfsDepths(sources);
      // Pre-index registration order for stable tie-breaking.
      const regIndex = new Map<RelayRuntime, number>();
      for (let i = 0; i < fullList.length; i++) {
        regIndex.set(fullList[i]!.runtime, i);
      }
      // Per-entry metrics, extracted so each fallback arm (missing depth /
      // missing priority / absent namespace → +Infinity) is exercised once,
      // independent of which side of a comparison the entry happens to land on.
      const depthOf = (e: RegisteredRelay): number =>
        e.namespace !== undefined ? (depths.get(e.namespace) ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
      const priorityOf = (e: RegisteredRelay): number =>
        e.namespace !== undefined
          ? (bpm.getPriority(e.namespace) ?? Number.POSITIVE_INFINITY)
          : Number.POSITIVE_INFINITY;

      const candidates = fullList.filter((entry) => dirtyRelays.has(entry.runtime));
      candidates.sort((a, b) => {
        const dA = depthOf(a);
        const dB = depthOf(b);
        if (dA !== dB) {
          return dA - dB;
        }
        const pA = priorityOf(a);
        const pB = priorityOf(b);
        if (pA !== pB) {
          return pA - pB;
        }
        // candidates ⊆ fullList ⊆ regIndex, so both lookups are always defined;
        // the `?? 0` is an unreachable defensive fallback.
        /* v8 ignore next */
        return (regIndex.get(a.runtime) ?? 0) - (regIndex.get(b.runtime) ?? 0);
      });
      return candidates.map((entry) => entry.runtime);
    },
  };
}
