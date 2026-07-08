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

import { type Getter, isGetter } from "r-machine/core";

// The shape a test asserts on — what `ctrl.createRes()` returns for a mocked
// ResMatrix. Unlike core's `Surface` (the consumer-facing projection, which
// HIDES `$`-members, relays and symbol keys), `TestSurface` hides NOTHING: it is
// the raw resource `R` with a single reshape — a `Getter<V>` member becomes a
// read-only property `V` instead of a callable `() => V`.
//
// This is the whole point: a dep is MOCKED in surface shape (getter → value) and
// the resource is now ASSERTED in the same shape (getter → value), so a test
// speaks one language. Everything else stays verbatim:
//   - Actions stay `Action<F>` (return = the resulting full state `S`, honest at
//     runtime — useful to assert the state an action produces).
//   - Relays, `$`-prefixed members and symbol keys (incl. `Symbol.dispose`) are
//     retained, so a test can inspect internals a consumer can't.
export type TestSurface<R> = {
  readonly [K in keyof R]: R[K] extends Getter<infer V> ? V : R[K];
};

// Runtime twin of `TestSurface`: clone the `res` reshaping only getters.
// Iterates `Reflect.ownKeys` (NOT `Object.keys`) so symbol keys like
// `Symbol.dispose` survive; a `Getter<V>` is installed as a `get` accessor (so
// `surface.x` reads its value, fresh on each access), everything else copied
// verbatim. Mirrors core's `buildSurface` but WITHOUT dropping `$`/relays/symbols.
//
// A plain `get foo()` accessor is transplanted LIVE (via its descriptor, bound
// to `res`), never read-and-frozen — exactly like `buildSurface`, so a test sees
// the same fresh-on-read behaviour a consumer does. (Same caveat as
// `buildSurface`: a plain `get` is always a plain live value; declaring a
// branded/wiring member via an accessor is unsupported misuse.)
//
// `[Symbol.dispose]` is copied through as-is: the resource's dispose is already
// idempotent (guaranteed uniformly by `createResMatrix`), so the mock controller
// can safely auto-dispose the instance on reset even if the test already did.
export function buildTestSurface(res: object): object {
  const out = Object.create(Object.getPrototypeOf(res)) as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(res)) {
    const desc = Object.getOwnPropertyDescriptor(res, key)!;
    if (desc.get !== undefined) {
      Object.defineProperty(out, key, { enumerable: true, get: () => desc.get!.call(res) });
      continue;
    }
    const entry = desc.value as unknown;
    if (isGetter(entry)) {
      Object.defineProperty(out, key, { enumerable: true, get: entry as () => unknown });
    } else {
      Object.defineProperty(out, key, { enumerable: true, value: entry });
    }
  }
  return out;
}
