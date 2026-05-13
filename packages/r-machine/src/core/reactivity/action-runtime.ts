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

import { withSilentZone } from "./cassette-recorder.js";
import { deepPartialMerge } from "./deep-partial-merge.js";
import type { StateCell } from "./state-cell.js";

export function makeAction<S, A extends unknown[]>(
  cell: StateCell<S>,
  reducer: (...args: A) => unknown
): (...args: A) => S {
  return (...args: A): S => {
    const raw = withSilentZone(() => reducer(...args));
    const prev = cell.peek();
    if (raw === prev) return prev;
    const merged = deepPartialMerge(prev, raw);
    if (merged === prev) return prev;
    cell.publish(merged);
    return merged;
  };
}
