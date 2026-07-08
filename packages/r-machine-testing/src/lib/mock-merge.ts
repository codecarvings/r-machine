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

import { deepPartialMerge, isPlainObject } from "r-machine/core";

// ---------------------------------------------------------------------------
// Runtime override merge for mockPlug.
//
// The resolved `plugin` (Surface tree) returned by the production resolve is
// CACHED/SHARED by the connector, and each dep/kit Surface has
// `configurable: false` members (built by core's `buildSurface`). We therefore
// never mutate it: every override is layered onto FRESH objects, copying the
// originals' property DESCRIPTORS (which transplants getters WITHOUT invoking
// them — sidestepping the deferred-kit self-reference getters that throw while
// a factory is still running).
//
// Override semantics: deps (map by name / list by index), `$.kit` entries and
// `$.ports`. Every override is a `DeepPartial` DEEP-MERGED over the real surface
// via `mergeLiveOverride` (the same merge law as actions / `ctrl.state`), with
// level-0 getters kept live on both sides — a mocked sub-key preserves its
// siblings and a stateful real getter keeps tracking. `$.state` is NOT an
// override here (driven by the controller); `$.kit` entries preserve the
// deferred-getter contract (see `cloneKit`). `$.locale` is handled upstream in
// mock-plug.ts by re-resolving in the effective locale (shells resolve their
// content BY locale).
// ---------------------------------------------------------------------------

type AnyRecord = Record<string, unknown>;

function hasOwn(obj: object, key: PropertyKey): boolean {
  return Object.hasOwn(obj, key);
}

/**
 * True when `data` carries an override that requires post-processing the
 * resolved plugin. A locale-only override (`$.locale` on a resource plug /
 * `$.ambientLocale` on a consumer) is a no-op here: it is already applied by
 * re-resolving the plug in the effective locale (see mock-plug.ts). State is NOT
 * a resolution override — it is driven by the mockPlug controller.
 */
export function hasOverrides(data: AnyRecord): boolean {
  for (const key of Object.keys(data)) {
    if (key !== "$") {
      return true; // a dep (map) or positional (list) override
    }
  }
  const ctx = data.$ as AnyRecord | undefined;
  if (ctx === undefined) {
    return false;
  }
  return ctx.ports !== undefined || ctx.kit !== undefined;
}

/**
 * Layer `partial` (a `DeepPartial`) over `prev` — the ONE merge law shared with
 * `deepPartialMerge` (actions, `ctrl.state`), extended so LEVEL-0 getters on
 * either side stay LIVE:
 *
 * - Original members are copied by DESCRIPTOR (a real getter — e.g. a stateful
 *   gear cell — is transplanted WITHOUT invoking it, staying live).
 * - An overridden key whose real OR override side is a getter becomes a live
 *   getter that RE-MERGES on every read: the real side is re-read lazily (so it
 *   keeps tracking state) and the override is re-read too (so a live override
 *   getter keeps changing). So mocking `foo`'s `b` while `foo` derives `a` from
 *   state → after `ctrl.state`, `foo` is `{ a: <new state>, b: <mock> }`.
 * - An overridden key with plain values on both sides is a fixed
 *   `deepPartialMerge` (sibling keys preserved; primitives replaced).
 *
 * Below level 0 the depth is delegated verbatim to `deepPartialMerge` (core,
 * untouched): `undefined`→skip, arrays/atomics→replace, plain objects→deep. A
 * non-plain side, or an empty override, degrades to `deepPartialMerge`/identity.
 */
export function mergeLiveOverride(prev: unknown, partial: unknown): unknown {
  if (partial === undefined) {
    return prev;
  }
  if (!isPlainObject(prev) || !isPlainObject(partial)) {
    return deepPartialMerge(prev, partial); // base case: whole-value semantics
  }
  if (Object.keys(partial).length === 0) {
    return prev; // no-op override → keep identity
  }
  const out = Object.create(Object.getPrototypeOf(prev)) as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(prev)) {
    if (typeof key === "string" && hasOwn(partial, key)) {
      continue; // overridden below
    }
    Object.defineProperty(out, key, Object.getOwnPropertyDescriptor(prev, key)!);
  }
  for (const key of Object.keys(partial)) {
    const realDesc = Object.getOwnPropertyDescriptor(prev, key);
    const ovDesc = Object.getOwnPropertyDescriptor(partial, key)!;
    if (realDesc?.get !== undefined || ovDesc.get !== undefined) {
      // Live: re-merge each read so a stateful real getter keeps tracking and a
      // live override getter keeps being re-read.
      Object.defineProperty(out, key, {
        enumerable: true,
        configurable: true,
        get: () => {
          const realValue =
            realDesc === undefined ? undefined : realDesc.get ? realDesc.get.call(prev) : realDesc.value;
          const ovValue = ovDesc.get ? ovDesc.get.call(partial) : ovDesc.value;
          return deepPartialMerge(realValue, ovValue);
        },
      });
    } else {
      Object.defineProperty(out, key, {
        enumerable: true,
        configurable: true,
        writable: false,
        value: deepPartialMerge(realDesc === undefined ? undefined : realDesc.value, ovDesc.value),
      });
    }
  }
  return out;
}

/**
 * Apply a single dep-position override. A normal dep resolves to a Surface →
 * layer the partial over it. A `res.perLocale(...)` dep resolves to a LOADER
 * function `(locale) => Promise<Surface>` → keep it a loader, but per call
 * resolve the REAL localized surface and deep-merge the mock's returned partial
 * ON TOP (so the mock overrides only the fields it names, inheriting the rest
 * of the real shell/locale). Detection is on the REAL resolved value: only a
 * perLocale loader is a function; the type layer guarantees the override is
 * then a function too.
 */
function applyDepOverride(real: unknown, override: AnyRecord): unknown {
  if (typeof real === "function") {
    const realLoader = real as (locale: unknown) => Promise<unknown>;
    const mockFn = override as unknown as (locale: unknown) => unknown;
    return async (locale: unknown): Promise<unknown> =>
      mergeLiveOverride(await realLoader(locale), await mockFn(locale));
  }
  return mergeLiveOverride(real, override);
}

/**
 * Clone the kit object applying per-entry overrides. Non-overridden entries are
 * copied by descriptor — crucially keeping any chain-deferred self-reference
 * getter LAZY (reading it mid-factory throws `ERR_CIRCULAR_DEPENDENCY`).
 * Overridden entries become a lazy, memoized getter that reads the original
 * entry only at access time (by then the factory has committed) and layers the
 * partial via `mergeLiveOverride` — so deferred kit entries can be overridden
 * without forcing an early read. (Memoizing the merged OBJECT is safe: its own
 * level-0 getters stay live.)
 */
export function cloneKit(kit: object, kitOverride: AnyRecord): object {
  const out: AnyRecord = {};
  for (const key of Reflect.ownKeys(kit)) {
    if (typeof key === "string" && hasOwn(kitOverride, key)) {
      continue; // replaced below
    }
    Object.defineProperty(out, key, Object.getOwnPropertyDescriptor(kit, key)!);
  }
  for (const key of Object.keys(kitOverride)) {
    const origDesc = Object.getOwnPropertyDescriptor(kit, key);
    const partial = kitOverride[key] as AnyRecord;
    let cached: object | undefined;
    let resolved = false;
    Object.defineProperty(out, key, {
      enumerable: true,
      configurable: true,
      get: () => {
        if (!resolved) {
          // Read the original lazily: a getter (deferred kit) only resolves once
          // its slot is committed; a plain value (eager kit) reads immediately.
          const original = origDesc?.get ? origDesc.get.call(kit) : (origDesc?.value as object | undefined);
          cached = mergeLiveOverride(original ?? Object.create(null), partial) as object;
          resolved = true;
        }
        return cached;
      },
    });
  }
  return out;
}

/**
 * Clone the `$` context applying ctx-level overrides. `$.ports` is deep-merged
 * onto a fresh ports object (never mutating the shared `head.ports`); `$.kit` is
 * cloned with per-entry overrides (see `cloneKit`). State is NOT handled here —
 * live state is driven by the mockPlug controller (`ctrl.state` / `ctrl.deps`).
 */
export function cloneCtx($: object, ctxOverride: AnyRecord | undefined): object {
  if (ctxOverride === undefined) {
    return $;
  }
  const overridePorts = ctxOverride.ports !== undefined;
  const overrideKit = ctxOverride.kit !== undefined;
  if (!overridePorts && !overrideKit) {
    return $;
  }

  const out: AnyRecord = {};
  for (const key of Reflect.ownKeys($)) {
    Object.defineProperty(out, key, Object.getOwnPropertyDescriptor($, key)!);
  }

  if (overridePorts) {
    Object.defineProperty(out, "ports", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: mergeLiveOverride(($ as AnyRecord).ports, ctxOverride.ports),
    });
  }

  if (overrideKit) {
    Object.defineProperty(out, "kit", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: cloneKit(($ as AnyRecord).kit as object, ctxOverride.kit as AnyRecord),
    });
  }

  return out;
}

/** Clone a MAP plugin (`{ ...kit, ...deps, $ }`) applying dep + ctx overrides. */
export function cloneMapPlugin(plugin: object, data: AnyRecord): object {
  const ctxOverride = data.$ as AnyRecord | undefined;
  const out: AnyRecord = {};
  for (const key of Reflect.ownKeys(plugin)) {
    if (key === "$") {
      continue; // rebuilt last
    }
    if (typeof key === "string" && hasOwn(data, key)) {
      // Dep override. A normal dep is an eager Surface; a perLocale dep is a
      // loader function (see applyDepOverride).
      out[key] = applyDepOverride((plugin as AnyRecord)[key], data[key] as AnyRecord);
    } else {
      // Copy descriptor: keeps eager values and any lazy deferred-kit getter lazy.
      Object.defineProperty(out, key, Object.getOwnPropertyDescriptor(plugin, key)!);
    }
  }
  const ctx = cloneCtx((plugin as AnyRecord).$ as object, ctxOverride);
  out.$ = ctx;

  // Mirror kit overrides onto the hoisted top-level keys so `plugin.foo` and
  // `plugin.$.kit.foo` stay the same (overridden) surface. Delegate lazily to
  // the single cloned kit (keeps the deferred-getter contract). A kit name
  // shadowed by a same-named dep is left to the dep view — the kit override is
  // still reachable via `$.kit`.
  const kitOverride = ctxOverride?.kit as AnyRecord | undefined;
  if (kitOverride !== undefined) {
    const clonedKit = (ctx as AnyRecord).kit as AnyRecord;
    for (const key of Object.keys(kitOverride)) {
      if (hasOwn(out, key) && !hasOwn(data, key)) {
        Object.defineProperty(out, key, {
          enumerable: true,
          configurable: true,
          get: () => clonedKit[key],
        });
      }
    }
  }
  return out;
}

/** Clone a LIST plugin (`[...deps, $]`) applying positional + ctx overrides. */
export function cloneListPlugin(plugin: readonly unknown[], data: AnyRecord): unknown[] {
  const ctxOverride = data.$ as AnyRecord | undefined;
  const lastIdx = plugin.length - 1;
  const out: unknown[] = [];
  for (let i = 0; i < lastIdx; i++) {
    const override = data[String(i)] as AnyRecord | undefined;
    out.push(override !== undefined ? applyDepOverride(plugin[i], override) : plugin[i]);
  }
  out.push(cloneCtx(plugin[lastIdx] as object, ctxOverride));
  return out;
}
