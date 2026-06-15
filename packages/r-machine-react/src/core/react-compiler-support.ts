/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

// ─── React Compiler support ───────────────────────────────────────────────
//
// R-Machine surfaces have a stable object identity backed by live getters over
// reactive cells. React Compiler assumes everything a hook returns is immutable
// and memoizes scopes by reference identity, so a stable surface reads as
// "unchanged" → stale. The opt-in `reactCompiler` strategy flag fixes this by
// handing each reactive surface a fresh-identity Proxy on every reactive
// re-render (see react-bare-toolset.tsx). A bare Proxy (no traps) forwards every
// operation to its target, so reads stay live and lazy and spread/enumeration
// remain faithful — its only effect is a fresh object identity, which is exactly
// what React Compiler needs to see.
//
// (There is no runtime auto-detection of the compiler: it is a build-time
// transform and its only runtime artifact, `useMemoCache`, ships in React 19
// regardless — probing for it would false-positive for every default user. The
// guard against accidental staleness is documentation: enabling React Compiler
// with R-Machine is discouraged.)

const PASSTHROUGH: ProxyHandler<object> = {};

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

/**
 * Everything the wrapper needs to know about a plug's resolved result. A
 * reactive (outer / vertex) surface can reach the consumer through THREE paths,
 * and all are covered here:
 *   1. a direct dep — list position (`nsDepList` + `reactiveDepsSet`) or map key
 *      (`reactiveMapKeys`);
 *   2. `$.kit.{name}` — a `gear:outer` placed in the consumer kit (`reactiveKitKeys`);
 *   3. map-mode top-level kit spread — `buildMapPlugin` does `{ ...kit, ...deps, $ }`,
 *      so a reactive kit entry is also reachable as `result.{name}` (folded into
 *      `reactiveMapKeys`).
 */
export interface ReactiveWrapInfo {
  readonly isList: boolean;
  /** List mode: index → namespace, to test positions against `reactiveDepsSet`. */
  readonly nsDepList: readonly string[];
  /** Reactive dep namespaces (list-position test). */
  readonly reactiveDepsSet: ReadonlySet<string>;
  /** Map mode: top-level keys to wrap (reactive dep keys ∪ reactive kit keys). */
  readonly reactiveMapKeys: ReadonlySet<string>;
  /** Reactive kit keys, wrapped under `$.kit` in both modes. */
  readonly reactiveKitKeys: ReadonlySet<string>;
}

/**
 * Give every reactive surface in `result` a fresh passthrough-Proxy identity,
 * routing all three reachability paths through ONE shared surface→proxy map so
 * the same underlying surface yields the same proxy wherever it appears (e.g.
 * `result.cart` and `$.kit.cart`). The `$` and `$.kit` wrappers are memoized
 * (those objects are invariant for a given result), so identities are stable
 * across repeated accesses within one (plugin, version).
 */
export function wrapReactiveResult(result: unknown, info: ReactiveWrapInfo): unknown {
  const surfaceCache = new Map<object, object>();
  const wrapSurface = (value: unknown): unknown => {
    if (!isObject(value)) {
      return value;
    }
    let proxy = surfaceCache.get(value);
    if (proxy === undefined) {
      proxy = new Proxy(value, PASSTHROUGH);
      surfaceCache.set(value, proxy);
    }
    return proxy;
  };

  // `$.kit` proxy — wraps reactive kit entries, forwards the rest. Memoized.
  let kitProxy: unknown;
  let kitProxyBuilt = false;
  const wrapKit = (kit: unknown): unknown => {
    if (info.reactiveKitKeys.size === 0 || !isObject(kit)) {
      return kit;
    }
    if (!kitProxyBuilt) {
      kitProxyBuilt = true;
      kitProxy = new Proxy(kit, {
        get(target, key) {
          const value = Reflect.get(target, key);
          return typeof key === "string" && info.reactiveKitKeys.has(key) ? wrapSurface(value) : value;
        },
      });
    }
    return kitProxy;
  };

  // `$` proxy — intercepts only `.kit` (to wrap reactive kit entries), forwards
  // locale / setLocale / getPath / params / ports / … verbatim. Memoized.
  let dollarProxy: unknown;
  let dollarProxyBuilt = false;
  const wrap$ = (dollar: unknown): unknown => {
    if (info.reactiveKitKeys.size === 0 || !isObject(dollar)) {
      return dollar;
    }
    if (!dollarProxyBuilt) {
      dollarProxyBuilt = true;
      dollarProxy = new Proxy(dollar, {
        get(target, key) {
          const value = Reflect.get(target, key);
          return key === "kit" ? wrapKit(value) : value;
        },
      });
    }
    return dollarProxy;
  };

  if (info.isList) {
    // `[...deps, $]` — kit is NOT spread at top level in list mode, only under `$.kit`.
    const out = (result as unknown[]).slice();
    const depCount = Math.min(info.nsDepList.length, out.length);
    for (let i = 0; i < depCount; i++) {
      if (info.reactiveDepsSet.has(info.nsDepList[i] as string)) {
        out[i] = wrapSurface(out[i]);
      }
    }
    if (out.length > 0) {
      out[out.length - 1] = wrap$(out[out.length - 1]); // trailing `$`
    }
    return out;
  }

  // `{ ...kit, ...deps, $ }` — object destructuring uses `get`, so a get-trap
  // Proxy covers named reads and rest-spread; `Reflect.get` keeps deferred-kit
  // getters lazy.
  return new Proxy(result as object, {
    get(target, key) {
      const value = Reflect.get(target, key);
      if (key === "$") {
        return wrap$(value);
      }
      return typeof key === "string" && info.reactiveMapKeys.has(key) ? wrapSurface(value) : value;
    },
  });
}
