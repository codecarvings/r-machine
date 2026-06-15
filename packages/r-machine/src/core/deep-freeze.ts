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

import { isPlainObject } from "./deep-partial.js";

/**
 * Recursively freeze a state value IN PLACE and return it (same reference, so
 * identity-based change detection in `deepPartialMerge`/`publish` is preserved).
 *
 * A dev-only guard (see `isDevEnv`): once frozen, any in-place mutation of the
 * value a consumer read from a cell — `state.count = 1`, `state.items.push(x)` —
 * throws a `TypeError` in strict mode (ESM is always strict) at the exact write
 * site, instead of silently failing to re-render. State is replace-only: it
 * changes only when an action returns a partial and the cell `publish`es a new
 * object.
 *
 * Traversal mirrors `deepPartialMerge`: only **plain objects** and **arrays**
 * are frozen and recursed into. Atomics/exotics (Date, Map, Set, RegExp, class
 * instances, functions, …) are left untouched — freezing a `Map` would not stop
 * `.set(...)` and freezing a class instance could break it, so we treat them as
 * opaque, exactly as the merge does.
 *
 * Cheap by design: `deepPartialMerge` reuses unchanged subtrees by reference,
 * and an already-frozen plain-object/array is — by this function's own
 * invariant — already deep-frozen, so `Object.isFrozen` short-circuits the walk.
 * After an action only the freshly-spread top object and the changed path are
 * unfrozen, so the cost is O(changed), not O(state).
 */
export function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    if (Object.isFrozen(value)) {
      return value;
    }
    for (const item of value) {
      deepFreeze(item);
    }
    Object.freeze(value);
    return value;
  }
  if (isPlainObject(value)) {
    if (Object.isFrozen(value)) {
      return value;
    }
    for (const key of Object.keys(value)) {
      deepFreeze(value[key]);
    }
    Object.freeze(value);
    return value;
  }
  // Primitives and atomics/exotics: opaque, left as-is.
  return value;
}
