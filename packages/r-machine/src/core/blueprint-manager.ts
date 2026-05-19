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

import { ERR_CIRCULAR_DEPENDENCY, RMachineResolveError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import { type Blueprint, createBlueprint } from "./blueprint.js";
import type { BusHost } from "./event-bus.js";
import type { AnyNamespace } from "./res-domain.js";
import type { ResLayoutEntryType, ResLayoutResolver } from "./res-layout.js";
import type { AnyNamespaceList } from "./res-list.js";
import {
  type AnyResModule,
  type ResModuleLoaderFn,
  type ResModuleLoaderFnOptions,
  validateResModule,
} from "./res-module.js";
import type { ResFamily } from "./res-plug.js";

// SEP = U+001F (Unit Separator). An empty locale prefix means `undefined`.
// For blueprint-manager: only `shell` is locale-keyed. `shell(mono)` is unique
// per blueprint (locale baked in elsewhere), so it falls into the default case.
export function getBlueprintResCacheKey(
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  layoutEntryType: ResLayoutEntryType,
  genId?: number
): string {
  switch (layoutEntryType) {
    case "shell":
      return `S:${locale}\x1f${namespace}`;
    case "gear:outer(vertex)":
      return `V:${genId ?? 0}\x1f${namespace}`;
    default:
      return `\x1f${namespace}`;
  }
}

export class BlueprintManager {
  constructor(
    protected resLayoutResolver: ResLayoutResolver,
    protected loadResModuleFn: ResModuleLoaderFn,
    protected kitDepList: {
      [F in ResFamily]: AnyNamespaceList;
    },
    priority: AnyNamespaceList,
    protected busHost: BusHost,
    // When true, every getBlueprint() call evicts any resolved-Blueprint entry
    // for the requested namespace before serving — forcing a fresh module
    // import. Used in dev to break HMR staleness: Node/Turbopack invalidate
    // their import cache on file change, but a cached Blueprint still
    // references the prior factory closure, leading to server SSR rendering
    // stale output and producing a hydration mismatch on the next request.
    // In-flight Promises in the cache are NOT evicted, so concurrent resolves
    // within a single request still share work.
    protected readonly bypassCache: boolean = false
  ) {
    this.priorityIndex = new Map();
    for (let i = 0; i < priority.length; i++) {
      this.priorityIndex.set(priority[i] as AnyNamespace, i);
    }
  }

  protected readonly cache = new Map<string, Blueprint | Promise<Blueprint>>();
  protected readonly waits = new Map<string, Set<string>>();
  protected readonly forwardDeps = new Map<AnyNamespace, Set<AnyNamespace>>();
  protected readonly reverseDeps = new Map<AnyNamespace, Set<AnyNamespace>>();
  protected readonly keysByNs = new Map<AnyNamespace, Set<string>>();
  // Reverse index path → { namespace, locale }, recorded at loadModule time.
  // The host's HMR hook calls `reloadModule(path)` with the same `path` the
  // loader received as its first argument; this map turns it back into the
  // pair needed to drive the invalidate cascade. `locale` is recorded only
  // when the layout entry is locale-keyed (`shell`) — for everything else
  // the file identity does not depend on locale, so we store `undefined` and
  // the cascade falls back to full-namespace scope.
  protected readonly nsByPath = new Map<string, { namespace: AnyNamespace; locale: AnyLocale | undefined }>();
  // Lower index = higher priority. Namespaces not in the priority list are
  // absent from this map. Consumed by the relay ordering system as the
  // tie-breaker between sibling relays at the same dep depth.
  protected readonly priorityIndex: Map<AnyNamespace, number>;
  protected onInvalidate?: (ns: AnyNamespace, locale: AnyLocale | undefined) => void;

  setOnInvalidate(callback: (ns: AnyNamespace, locale: AnyLocale | undefined) => void): void {
    this.onInvalidate = callback;
  }

  protected findWaitCyclePath(from: string, target: string): string[] | undefined {
    const stack: Array<[string, string[]]> = [[from, [from]]];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const [node, path] = stack.pop()!;
      if (node === target) {
        return path;
      }
      if (visited.has(node)) {
        continue;
      }
      visited.add(node);
      const neighbors = this.waits.get(node);
      if (neighbors) {
        for (const next of neighbors) {
          stack.push([next, [...path, next]]);
        }
      }
    }
    return undefined;
  }

  protected async loadModule(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    layoutEntryType: ResLayoutEntryType
  ): Promise<AnyResModule> {
    const path = this.resLayoutResolver.resolvePath(namespace, locale, layoutEntryType);
    const namespaceParts = this.resLayoutResolver.resolveNamespaceParts(namespace);
    const prefix = namespaceParts[0];
    const options: ResModuleLoaderFnOptions = {
      namespace,
      namespaceParts,
      pathParts: [prefix, path.slice(prefix.length)],
      locale,
    };
    // Only locale-keyed entries (`shell`) record the locale: for everything
    // else the file is shared across locales, so any incoming `reloadModule`
    // must invalidate the whole namespace.
    this.nsByPath.set(path, {
      namespace,
      locale: layoutEntryType === "shell" ? locale : undefined,
    });
    const module = await this.loadResModuleFn(path, options);
    this.busHost.bus?.emit({ type: "blueprint:moduleLoaded", namespace, locale });
    const error = validateResModule(module);
    if (error) {
      throw error;
    }
    return module;
  }

  protected async loadDepsBlueprints(
    namespace: AnyNamespace,
    family: ResFamily,
    locale: AnyLocale | undefined,
    nsDepList: AnyNamespaceList,
    chain: readonly string[]
  ): Promise<AnyNamespace[]> {
    const kitDeps = this.kitDepList[family].filter((n) => n !== namespace);
    const allNsDeps = [...new Set([...nsDepList, ...kitDeps])];
    // Eager preload only the explicit plug deps. Kit deps are tracked in
    // the dep graph (via the returned allNsDeps) for HMR cascade purposes,
    // but loaded lazily by the JunctureManager at factory-runtime. Eagerly
    // preloading them would deadlock when the kit holds two or more gears
    // of the same family: each kit-mate conservatively waits for every
    // other kit-mate, triggering the concurrent-resolution cycle detector.
    await Promise.all(
      nsDepList.map((depNs) => {
        const depLayout = this.resLayoutResolver.resolveLayoutEntryType(depNs);
        const depKey = getBlueprintResCacheKey(depNs, locale, depLayout);
        return this.getBlueprintInternal(depNs, locale, depLayout, depKey, chain);
      })
    );
    return allNsDeps;
  }

  protected registerDepsInGraph(namespace: AnyNamespace, allNsDeps: AnyNamespace[]): void {
    this.forwardDeps.set(namespace, new Set(allNsDeps));
    for (const dep of allNsDeps) {
      let rev = this.reverseDeps.get(dep);
      if (!rev) {
        rev = new Set();
        this.reverseDeps.set(dep, rev);
      }
      rev.add(namespace);
    }
  }

  protected resolveBlueprint(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    key: string,
    layoutEntryType: ResLayoutEntryType,
    chain: readonly string[]
  ): Promise<Blueprint> {
    this.busHost.bus?.emit({ type: "blueprint:resolveStart", namespace, locale, layoutEntryType });
    let pendingPromise!: Promise<Blueprint>;
    const blueprintPromise = (async () => {
      let blueprint: Blueprint;
      let allNsDeps: AnyNamespace[] | undefined;
      try {
        const module = await this.loadModule(namespace, locale, layoutEntryType);
        blueprint = createBlueprint(module, namespace, locale, layoutEntryType);
        if (blueprint.originType === "res-matrix") {
          allNsDeps = await this.loadDepsBlueprints(
            namespace,
            blueprint.family,
            locale,
            blueprint.plugHead!.nsDepList,
            [...chain, key]
          );
        }
      } catch (error) {
        // Identity check on cleanup: if our entry was already replaced by
        // another resolve (race after evict), the new resolve owns all shared
        // state — don't touch cache, waits, or keysByNs. Our error still
        // propagates to whoever was awaiting our promise.
        if (this.cache.get(key) === pendingPromise) {
          this.cache.delete(key);
          this.waits.delete(key);
          this.keysByNs.get(namespace)?.delete(key);
        }
        this.busHost.bus?.emit({ type: "blueprint:resolveError", namespace, locale, error });
        throw error;
      }
      // Identity check before committing side effects: if the cache entry was
      // evicted (and possibly replaced) while this resolve was in flight, our
      // result is stale — return it but don't write cache nor dep graph.
      if (this.cache.get(key) !== pendingPromise) {
        this.busHost.bus?.emit({ type: "blueprint:resolveStale", namespace, locale });
        return blueprint;
      }
      this.cache.set(key, blueprint);
      if (allNsDeps) {
        this.registerDepsInGraph(namespace, allNsDeps);
      }
      this.waits.delete(key);
      this.busHost.bus?.emit({ type: "blueprint:resolved", namespace, locale, depList: allNsDeps ?? [] });
      return blueprint;
    })();
    pendingPromise = blueprintPromise;
    this.cache.set(key, pendingPromise);
    let keys = this.keysByNs.get(namespace);
    if (!keys) {
      keys = new Set();
      this.keysByNs.set(namespace, keys);
    }
    keys.add(key);
    return blueprintPromise;
  }

  protected async getBlueprintInternal(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    layoutEntryType: ResLayoutEntryType,
    key: string,
    chain: readonly string[]
  ): Promise<Blueprint> {
    if (chain.includes(key)) {
      const cycleChain = [...chain, key];
      this.busHost.bus?.emit({
        type: "blueprint:circularDepDetected",
        namespace,
        locale,
        chain: cycleChain,
      });
      throw new RMachineResolveError(
        ERR_CIRCULAR_DEPENDENCY,
        `Circular dependency detected: ${cycleChain.join(" -> ")}.`
      );
    }

    let cached = this.cache.get(key);
    if (this.bypassCache && cached !== undefined && !(cached instanceof Promise)) {
      // Resolved blueprint in cache — under dev mode, evict and force a fresh
      // resolve so the latest module version (Node/Turbopack already
      // hot-reloaded its module cache on file change) is picked up.
      this.evictBlueprint(namespace);
      cached = undefined;
    }
    if (cached !== undefined) {
      if (cached instanceof Promise && chain.length > 0) {
        for (const ancestor of chain) {
          const cyclePath = this.findWaitCyclePath(key, ancestor);
          if (cyclePath) {
            const cycleChain = [ancestor, ...cyclePath];
            this.busHost.bus?.emit({
              type: "blueprint:circularDepDetected",
              namespace,
              locale,
              chain: cycleChain,
            });
            throw new RMachineResolveError(
              ERR_CIRCULAR_DEPENDENCY,
              `Circular dependency detected across concurrent resolutions: ${cycleChain.join(" -> ")}.`
            );
          }
        }
        for (const ancestor of chain) {
          let set = this.waits.get(ancestor);
          if (!set) {
            set = new Set();
            this.waits.set(ancestor, set);
          }
          set.add(key);
        }
      }
      this.busHost.bus?.emit({ type: "blueprint:cacheHit", namespace, locale, layoutEntryType });
      return cached;
    }
    return this.resolveBlueprint(namespace, locale, key, layoutEntryType, chain);
  }

  async getBlueprint(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    layoutEntryType: ResLayoutEntryType,
    key: string
  ): Promise<Blueprint> {
    return this.getBlueprintInternal(namespace, locale, layoutEntryType, key, []);
  }

  getForwardClosure(nsList: Iterable<AnyNamespace>): Set<AnyNamespace> {
    const result = new Set<AnyNamespace>();
    const stack: AnyNamespace[] = [...nsList];
    while (stack.length > 0) {
      const ns = stack.pop()!;
      if (result.has(ns)) {
        continue;
      }
      result.add(ns);
      const deps = this.forwardDeps.get(ns);
      if (deps) {
        for (const d of deps) {
          stack.push(d);
        }
      }
    }
    return result;
  }

  /**
   * BFS over reverseDeps from each `source` namespace. Returns a Map where
   * each reachable namespace maps to its MIN distance from any source
   * (sources themselves have distance 0). Used by the relay ordering
   * provider to compute depth(relay) = distance from the mutated OG's
   * namespace to the relay's hosting OG namespace.
   */
  reverseBfsDepths(sources: Iterable<AnyNamespace>): Map<AnyNamespace, number> {
    const depths = new Map<AnyNamespace, number>();
    const queue: AnyNamespace[] = [];
    for (const s of sources) {
      if (!depths.has(s)) {
        depths.set(s, 0);
        queue.push(s);
      }
    }
    let head = 0;
    while (head < queue.length) {
      const n = queue[head++]!;
      const d = depths.get(n)!;
      const dependents = this.reverseDeps.get(n);
      if (!dependents) continue;
      for (const dep of dependents) {
        if (!depths.has(dep)) {
          depths.set(dep, d + 1);
          queue.push(dep);
        }
      }
    }
    return depths;
  }

  /** Returns the priority index for a namespace (lower = higher priority), or undefined if not in the atlas priority list. */
  getPriority(ns: AnyNamespace): number | undefined {
    return this.priorityIndex.get(ns);
  }

  getReverseClosure(ns: AnyNamespace): Set<AnyNamespace> {
    // Post-order DFS on reverseDeps: a node is appended AFTER all of its
    // dependents. Set preserves insertion order, so iterating the result yields
    // dispose-safe order (dependents first, ns last). If A depends on B, A is
    // visited as a dependent of B and appended before B — A's teardown can
    // therefore safely reference resources held by B.
    const result = new Set<AnyNamespace>();
    const visiting = new Set<AnyNamespace>();
    const visit = (n: AnyNamespace) => {
      if (visiting.has(n)) {
        return;
      }
      visiting.add(n);
      const dependents = this.reverseDeps.get(n);
      if (dependents) {
        for (const d of dependents) {
          visit(d);
        }
      }
      result.add(n);
    };
    visit(ns);
    return result;
  }

  evictBlueprint(ns: AnyNamespace, locale?: AnyLocale | undefined): void {
    const layoutType = this.resLayoutResolver.resolveLayoutEntryType(ns);
    // Locale-scoped eviction is meaningful only for `shell` (the one
    // locale-keyed layout type). For any other entry type the cache key is
    // locale-agnostic, so a `locale` argument is ignored and we fall through
    // to the full-namespace eviction below.
    if (locale !== undefined && layoutType === "shell") {
      const targetKey = getBlueprintResCacheKey(ns, locale, layoutType);
      const keys = this.keysByNs.get(ns);
      const removed = this.cache.delete(targetKey);
      const keyCount = removed ? 1 : 0;
      if (keys) {
        keys.delete(targetKey);
        if (keys.size === 0) {
          this.keysByNs.delete(ns);
        }
      }
      // Dep graph is namespace-level and survives per-locale eviction: other
      // locales of this shell may still be cached, and dependents still
      // reference `ns` regardless of locale.
      this.busHost.bus?.emit({ type: "blueprint:evicted", namespace: ns, locale, keyCount });
      return;
    }
    const keys = this.keysByNs.get(ns);
    const keyCount = keys?.size ?? 0;
    if (keys) {
      for (const key of keys) {
        this.cache.delete(key);
      }
      this.keysByNs.delete(ns);
    }
    const oldDeps = this.forwardDeps.get(ns);
    if (oldDeps) {
      for (const dep of oldDeps) {
        this.reverseDeps.get(dep)?.delete(ns);
      }
      this.forwardDeps.delete(ns);
    }
    // reverseDeps[ns] is left untouched: every dependent of ns is itself in the
    // current cascade closure and gets evicted in this same pass — its own
    // forwardDeps cleanup removes it from reverseDeps[ns]. Edges are rebuilt
    // when those dependents are re-loaded.
    this.busHost.bus?.emit({ type: "blueprint:evicted", namespace: ns, locale: undefined, keyCount });
  }

  reloadModule(path: string): void {
    const entry = this.nsByPath.get(path);
    if (entry === undefined) {
      // Module was never loaded under this path — nothing to invalidate.
      return;
    }
    const { namespace, locale } = entry;
    this.busHost.bus?.emit({ type: "blueprint:moduleInvalidated", namespace, locale });
    this.onInvalidate?.(namespace, locale);
  }
}
