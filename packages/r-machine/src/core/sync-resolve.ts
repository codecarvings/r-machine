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

// Synchronous-resolution fast path primitives.
//
// `getPluginPromise()` normally returns a real Promise that React's `use()`
// suspends on at first read. When the plugin can be produced WITHOUT awaiting
// anything (all dependency pods are already resolved in their slots), we can
// instead hand `use()` a thenable pre-tagged as fulfilled, which it unwraps
// synchronously — no Suspense fallback. See [[wire-manager.resolve]] and
// `ResManager.getPluginSync`.
//
// The sync path is a strict optimization: every layer attempts a synchronous
// resolve and returns the `ASYNC` sentinel the moment anything is genuinely
// asynchronous, at which point the caller falls back to the untouched async
// path. The sync path can therefore only ever *decline* to optimize — it can
// never produce a wrong plugin.

// Returned by any `*Sync` resolver to signal "not synchronously resolvable —
// fall back to the async path". A unique symbol so it can never collide with a
// legitimately-resolved plugin value (which may itself be any value, including
// `undefined` or other falsy primitives).
export const ASYNC: unique symbol = Symbol("rm.sync.async");

// Returned by the synchronous resolvers specifically for a COVERED vertex
// consumer whose parent (creator) slot is transiently absent/stale — e.g. an
// HMR `invalidate` disposed the creator slot and it has not been re-committed
// yet. Distinct from `ASYNC` because the caller MUST NOT fall back to the async
// path (whose covered branch THROWS `ERR_VERTEX_INSTANCE_NOT_FOUND`): instead
// the wire suspends on a stable pending promise and retries on the next render,
// once the creator re-resolves and re-commits the slot. See [[wire-manager.resolve]].
export const COVERED_PENDING: unique symbol = Symbol("rm.sync.coveredPending");

export type MaybeAsync<T> = T | typeof ASYNC;

// A Promise pre-tagged the way React 19's `use()` recognizes a settled value,
// so reading it during render returns the value synchronously instead of
// suspending. React reads `.status`/`.value` off the thenable; the underlying
// `Promise.resolve(value)` keeps it awaitable for any non-React consumer too.
export function fulfilledThenable(value: unknown): Promise<unknown> {
  const t = Promise.resolve(value) as Promise<unknown> & { status: string; value: unknown };
  t.status = "fulfilled";
  t.value = value;
  return t;
}

// True when `v` is then-able (a Promise or any custom thenable). The sync
// resolution path uses this to detect an ASYNC user factory: if invoking it
// returns a thenable, the factory is not synchronous and the sync attempt must
// bail. Mirrors the private predicate in relay.ts.
export function isThenable(v: unknown): v is PromiseLike<unknown> {
  return (
    v !== null &&
    (typeof v === "object" || typeof v === "function") &&
    typeof (v as { then?: unknown }).then === "function"
  );
}
