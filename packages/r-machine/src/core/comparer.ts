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
 * Shallow equality: equal when both values are the same reference, or both are
 * non-null objects (or arrays) with the same own enumerable keys whose values
 * are `Object.is`-equal. Arrays and plain objects never compare equal to each
 * other. One level deep only — nested objects are compared by reference.
 */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if (
      !Object.hasOwn(b, key) ||
      !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Built-in equality comparators, MobX-style. The string keys double as the
 * `EqualsStrategy` union (see below), keeping the two in sync.
 *
 * Not yet part of the public API surface — intentionally not re-exported from
 * `core/index.ts`. Kept self-contained so it can be exposed later (e.g. a
 * future `deep` strategy) without a refactor.
 */
export const Comparer = {
  identity: Object.is,
  shallow: shallowEqual,
  // deep: deepEqual,  ← V2, additive
} as const;

/** Built-in strategy names, derived from the `Comparer` namespace keys. */
export type EqualsStrategy = keyof typeof Comparer;

/**
 * Resolves a relay's `equals` config into a concrete comparator:
 * `undefined` → `identity` (`Object.is`), a strategy name → its built-in, a
 * function → itself.
 */
export function resolveEquals(
  equals: EqualsStrategy | ((a: any, b: any) => boolean) | undefined
): (a: any, b: any) => boolean {
  if (equals === undefined) {
    return Comparer.identity;
  }
  if (typeof equals === "function") {
    return equals;
  }
  return Comparer[equals];
}
