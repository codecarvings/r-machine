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

type BuiltinAtomic =
  | Date
  | RegExp
  | Map<unknown, unknown>
  | Set<unknown>
  | ((...args: any[]) => any)
  | Promise<unknown>
  | Error
  | URL
  | URLSearchParams
  | ArrayBuffer
  | ArrayBufferView;

type IsAtomic<T> = T extends BuiltinAtomic ? true : false;

export type DeepPartial<T> =
  IsAtomic<T> extends true
    ? T
    : T extends (infer I)[]
      ? DeepPartial<I>[]
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  if (proto !== Object.prototype) {
    return false;
  }
  // Reject branded atomics (Date, Map, Set, RegExp, URL, Promise, Error, ArrayBuffer, ArrayBufferView).
  // Plain objects share Object.prototype; any wrapped builtin has its own prototype chain and was rejected above.
  return true;
}

export function deepPartialMerge<S>(prev: S, partial: unknown): S {
  if (partial === undefined) {
    return prev;
  }

  if (!isPlainObject(prev) || !isPlainObject(partial)) {
    return partial as S;
  }

  let changed = false;
  const result: Record<string, unknown> = { ...prev };
  for (const key of Object.keys(partial)) {
    const partialValue = partial[key];
    if (partialValue === undefined) {
      continue;
    }
    const prevValue = result[key];
    const nextValue = deepPartialMerge(prevValue, partialValue);
    if (!Object.is(prevValue, nextValue)) {
      result[key] = nextValue;
      changed = true;
    }
  }

  return (changed ? result : prev) as S;
}
