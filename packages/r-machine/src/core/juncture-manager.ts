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

import { ERR_CIRCULAR_DEPENDENCY, ERR_VERTEX_INSTANCE_NOT_FOUND, RMachineResolveError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { Blueprint } from "./blueprint.js";
import type { BlueprintManager } from "./blueprint-manager.js";
import type { BusHost } from "./event-bus.js";
import { buildKernelJuncture, buildOuterJuncture, getCurrentSurface, type Juncture } from "./juncture.js";
import { tryGetManagedTeardown } from "./managed.js";
import type { PluginCtxAugmenter } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyNamespace, AnyNamespaceCollection } from "./res-domain.js";
import type { AnyResEquipment } from "./res-equipment.js";
import { isOuterGearLayoutType, type ResLayoutEntryType, type ResLayoutResolver } from "./res-layout.js";
import { type AnyNamespaceList, type AnyResolvedNamespaceList, isNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap, AnyResolvedNamespaceMap } from "./res-map.js";
import { PROCESS_SCOPE_PROVIDER, type RequestScope, type RequestScopeProvider, type Slot } from "./scope.js";
import type { AnySurface } from "./surface.js";
import type { VertexGearMap, VertexGearTagData } from "./vertex-gear.js";

// SEP = U+001F (Unit Separator). An empty locale prefix means `undefined`.
// For juncture-manager: both `shell` and `shell(mono)` need a
// locale-scoped key — at the juncture level the same shell namespace must
// resolve to different plugin instances per locale.
export function getJunctureResCacheKey(
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  layoutEntryType: ResLayoutEntryType,
  genId?: number
): string {
  switch (layoutEntryType) {
    case "shell":
    case "shell(mono)":
      return `S:${locale}\x1f${namespace}`;
    case "gear:outer(vertex)":
      return `V:${genId ?? 0}\x1f${namespace}`;
    default:
      return `\x1f${namespace}`;
  }
}

export class JunctureManager {
  constructor(
    protected resLayoutResolver: ResLayoutResolver,
    protected equipment: AnyResEquipment,
    protected blueprintManager: BlueprintManager,
    protected busHost: BusHost
  ) {
    blueprintManager.setOnInvalidate((ns) => this.invalidate(ns));
  }

  // Process-tier slots: Base + Inner + Shell live here for the lifetime of the
  // RMachine instance. Outer (and Outer-vertex) slots are routed via
  // `slotsForLayout` to either a request-scoped map (when a scope is active)
  // or this same `slots` map (fallback for client browser, tests, etc.).
  protected readonly slots = new Map<string, Slot>();
  protected readonly generationByNs = new Map<AnyNamespace, number>();
  protected readonly subscribersByNs = new Map<AnyNamespace, Set<() => void>>();
  protected readonly vertexSlotsByGenId = new Map<number, Set<AnyNamespace>>();

  protected scopeProvider: RequestScopeProvider = PROCESS_SCOPE_PROVIDER;

  setScopeProvider(p: RequestScopeProvider): void {
    this.scopeProvider = p;
  }

  getScopeProvider(): RequestScopeProvider {
    return this.scopeProvider;
  }

  // Routes Outer/Vertex slot lookups to the active request scope when one is
  // installed (e.g. inside an HTTP request); otherwise falls back to the
  // process-shared `slots` map. Base/Inner/Shell always use `slots` directly —
  // they're stateless or locale-keyed and safe to cache across requests.
  protected slotsForLayout(layoutType: ResLayoutEntryType): Map<string, Slot> {
    if (!isOuterGearLayoutType(layoutType)) return this.slots;
    const scope = this.scopeProvider.getActiveScope();
    if (!scope) return this.slots;
    return layoutType === "gear:outer(vertex)" ? scope.vertexSlots : scope.outerSlots;
  }

  protected vertexIndex(): Map<number, Set<AnyNamespace>> {
    const scope = this.scopeProvider.getActiveScope();
    return scope ? scope.vertexSlotsByGenId : this.vertexSlotsByGenId;
  }

  protected resolveJuncture(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    key: string,
    layoutType: ResLayoutEntryType,
    vertexTag: VertexGearTagData | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<Juncture> {
    const generation = this.generationByNs.get(namespace) ?? 0;
    this.busHost.bus?.emit({
      type: "juncture:resolveStart",
      namespace,
      locale,
      generation,
      vertexGenId: vertexTag?.genId,
    });
    // Capture the slot map once: same instance must back both the SET below
    // and the identity / delete checks inside the async closure. If the active
    // request scope changes mid-flight (extremely unlikely — would require
    // ALS context-hopping during a single resolve), we'd otherwise risk
    // mismatch. Capture-once guarantees consistency.
    const slotsMap = this.slotsForLayout(layoutType);
    let slot!: Slot;
    const juncturePromise = (async () => {
      try {
        const blueprint: Blueprint = await this.blueprintManager.getBlueprint(namespace, locale, layoutType, key);
        let juncture: Juncture;
        if (blueprint.originType === "res") {
          juncture = buildKernelJuncture(blueprint.origin as AnyRes, vertexTag);
          this.busHost.bus?.emit({ type: "juncture:built", namespace, kind: "kernel" });
        } else {
          const factory = blueprint.origin.factory as (
            locale: AnyLocale | undefined,
            chain: readonly AnyNamespace[]
          ) => Promise<AnyRes>;
          // Extend the chain with our own namespace before invoking the factory:
          // any nested loadKit / getJuncture under us will see us as in-flight
          // and break cycles via the deferred-kit getter. The "self" of the
          // running factory is implicitly chain[chain.length - 1].
          this.busHost.bus?.emit({ type: "juncture:factoryInvoked", namespace, locale });
          const res = await factory(locale, [...chain, namespace]);
          juncture = blueprint.isOuterGear ? buildOuterJuncture(res, vertexTag) : buildKernelJuncture(res, vertexTag);
          this.busHost.bus?.emit({
            type: "juncture:built",
            namespace,
            kind: blueprint.isOuterGear ? "outer" : "kernel",
          });
        }
        // Stale check: generation mismatch (HMR happened) OR slot identity mismatch
        // (slot was disposed and possibly re-created during this resolve).
        const currentGen = this.generationByNs.get(namespace) ?? 0;
        const generationStale = currentGen !== generation;
        const slotIdentityStale = slotsMap.get(key) !== slot;
        if (generationStale || slotIdentityStale) {
          const teardown = tryGetManagedTeardown(juncture.res);
          if (teardown) {
            try {
              teardown();
            } catch (e) {
              console.error(e);
            }
          }
          this.busHost.bus?.emit({
            type: "juncture:resolveStale",
            namespace,
            reason: generationStale ? "generation" : "slotIdentity",
            teardownInvoked: teardown !== undefined,
          });
          return juncture;
        }
        slot.content = juncture;
        this.busHost.bus?.emit({ type: "juncture:slotCommitted", namespace, generation });
        return juncture;
      } catch (error) {
        if (slotsMap.get(key) === slot) {
          slotsMap.delete(key);
        }
        this.busHost.bus?.emit({ type: "juncture:resolveError", namespace, error });
        throw error;
      }
    })();
    slot = { key, namespace, generation, content: juncturePromise };
    slotsMap.set(key, slot);
    return juncturePromise;
  }

  protected isSlotFresh(slot: Slot): boolean {
    return slot.generation === (this.generationByNs.get(slot.namespace) ?? 0);
  }

  protected async getJuncture(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<Juncture> {
    const layoutType = this.resLayoutResolver.resolveLayoutEntryType(namespace);
    const slotsMap = this.slotsForLayout(layoutType);
    if (layoutType === "gear:outer(vertex)") {
      const existingGenId = vertexGearMap?.[namespace];
      if (existingGenId !== undefined) {
        const consumerKey = getJunctureResCacheKey(namespace, locale, layoutType, existingGenId);
        const consumerSlot = slotsMap.get(consumerKey);
        if (consumerSlot === undefined || !this.isSlotFresh(consumerSlot)) {
          this.busHost.bus?.emit({ type: "juncture:vertexConsumerMissing", namespace, genId: existingGenId });
          throw new RMachineResolveError(
            ERR_VERTEX_INSTANCE_NOT_FOUND,
            `Vertex gear instance "${namespace}" with genId ${existingGenId} not found in JunctureManager cache.`
          );
        }
        this.busHost.bus?.emit({ type: "juncture:vertexConsumerResolved", namespace, consumerGenId: existingGenId });
        return consumerSlot.content;
      }
      const creatorKey = getJunctureResCacheKey(namespace, locale, layoutType, genId);
      const creatorSlot = slotsMap.get(creatorKey);
      if (creatorSlot !== undefined && this.isSlotFresh(creatorSlot)) {
        this.busHost.bus?.emit({
          type: "juncture:cacheHit",
          namespace,
          locale,
          generation: creatorSlot.generation,
        });
        return creatorSlot.content;
      }
      // Register vertex creation in genId index before spawning the resolve,
      // so the index and slots map are populated together (resolveJuncture
      // creates the slot synchronously before returning the promise).
      const vertexIdx = this.vertexIndex();
      let vertexSet = vertexIdx.get(genId);
      if (!vertexSet) {
        vertexSet = new Set();
        vertexIdx.set(genId, vertexSet);
      }
      vertexSet.add(namespace);
      this.busHost.bus?.emit({ type: "juncture:vertexSlotRegistered", namespace, genId });
      return this.resolveJuncture(namespace, locale, creatorKey, layoutType, { namespace, genId }, chain);
    }

    const key = getJunctureResCacheKey(namespace, locale, layoutType);
    const cached = slotsMap.get(key);
    if (cached !== undefined && this.isSlotFresh(cached)) {
      this.busHost.bus?.emit({ type: "juncture:cacheHit", namespace, locale, generation: cached.generation });
      return cached.content;
    }
    return this.resolveJuncture(namespace, locale, key, layoutType, undefined, chain);
  }

  async getPlugin(
    kit: AnyNamespaceMap,
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    chain: readonly AnyNamespace[],
    genId: number,
    vertexGearMap: VertexGearMap | undefined
  ): Promise<unknown> {
    const isList = isNamespaceList(nsDeps);
    // Partition kit entries:
    //   - eager: ns is NOT in chain → resolved now.
    //   - deferred: ns IS in chain (a transitive ancestor — includes self,
    //     which is chain[chain.length - 1]) → installed as a lazy getter
    //     after the eager resolves, since pre-resolving them would deadlock.
    const eagerKitEntries: Array<readonly [string, AnyNamespace]> = [];
    const deferredKitEntries: Array<readonly [string, AnyNamespace]> = [];
    for (const entry of Object.entries(kit)) {
      if (chain.includes(entry[1])) {
        deferredKitEntries.push(entry);
      } else {
        eagerKitEntries.push(entry);
      }
    }
    this.busHost.bus?.emit({
      type: "juncture:kitPartitioned",
      selfNamespace: chain.length > 0 ? chain[chain.length - 1] : undefined,
      eager: eagerKitEntries.map(([, ns]) => ns),
      deferred: deferredKitEntries.map(([, ns]) => ns),
    });

    const [kitDeps, deps] = await Promise.all([
      this.loadKit(eagerKitEntries, locale, chain),
      isList
        ? this.loadListDeps(nsDeps, locale, genId, vertexGearMap, chain)
        : this.loadMapDeps(nsDeps, locale, genId, vertexGearMap, chain),
    ]);

    return isList
      ? this.buildListPlugin(kitDeps, deps as AnyResolvedNamespaceList, locale, augmentCtx, deferredKitEntries)
      : this.buildMapPlugin(kitDeps, deps as AnyResolvedNamespaceMap, locale, augmentCtx, deferredKitEntries);
  }

  // Returns a getter that resolves a chain-deferred kit entry from its slot
  // at access time. While the slot is still mid-resolution (Promise content),
  // accessing it would mean a real cyclic kit dependency — throw with a clear
  // message. Once the ancestor's factory has committed its juncture, the
  // captured reference works (supports late-bound recursive patterns,
  // including self-reference: self is just chain[last]).
  protected createDeferredKitGetter(namespace: AnyNamespace, locale: AnyLocale | undefined): () => AnySurface {
    const layoutType = this.resLayoutResolver.resolveLayoutEntryType(namespace);
    const slotKey = getJunctureResCacheKey(namespace, locale, layoutType);
    return () => {
      // Re-resolve the slot map each call: a deferred-kit getter created
      // during one resolution may be called later (inside a child plugin's
      // builder) and the active request scope at that later moment is what
      // matters. For Outer types this hits the same scope as the original
      // resolve when invocation stays within the same async chain.
      const slot = this.slotsForLayout(layoutType).get(slotKey);
      if (slot === undefined || slot.content instanceof Promise) {
        this.busHost.bus?.emit({ type: "juncture:deferredKitAccessed", namespace, ready: false });
        throw new RMachineResolveError(
          ERR_CIRCULAR_DEPENDENCY,
          `Kit access on "${namespace}" is not available: that namespace is currently being resolved as a transitive ancestor.`
        );
      }
      this.busHost.bus?.emit({ type: "juncture:deferredKitAccessed", namespace, ready: true });
      return getCurrentSurface(slot.content);
    };
  }

  protected async loadKit(
    entries: ReadonlyArray<readonly [string, AnyNamespace]>,
    locale: AnyLocale | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<AnyResolvedNamespaceMap> {
    const resolved = await Promise.all(
      entries.map(
        async ([k, ns]) => [k, getCurrentSurface(await this.getJuncture(ns, locale, 0, undefined, chain))] as const
      )
    );
    return Object.fromEntries(resolved);
  }

  protected async loadMapDeps(
    nsDeps: AnyNamespaceMap,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<AnyResolvedNamespaceMap> {
    const entries = await Promise.all(
      Object.entries(nsDeps).map(async ([key, namespace]) => [
        key,
        getCurrentSurface(await this.getJuncture(namespace, locale, genId, vertexGearMap, chain)),
      ])
    );
    return Object.fromEntries(entries);
  }

  protected async loadListDeps(
    nsDeps: AnyNamespaceList,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<AnyResolvedNamespaceList> {
    return Promise.all(
      nsDeps.map(async (namespace) =>
        getCurrentSurface(await this.getJuncture(namespace as AnyNamespace, locale, genId, vertexGearMap, chain))
      )
    );
  }

  protected buildListPlugin(
    kit: AnyResolvedNamespaceMap,
    deps: AnyResolvedNamespaceList,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    deferredKitEntries: ReadonlyArray<readonly [string, AnyNamespace]>
  ): unknown {
    const $ = { kit };
    augmentCtx($);
    const plugin = [...deps, $];
    // Install deferred-resolve getters AFTER any spread, so they remain lazy.
    for (const [k, ns] of deferredKitEntries) {
      const getter = this.createDeferredKitGetter(ns, locale);
      Object.defineProperty(kit, k, { enumerable: true, configurable: true, get: getter });
    }
    return plugin;
  }

  protected buildMapPlugin(
    kit: AnyResolvedNamespaceMap,
    deps: AnyResolvedNamespaceMap,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    deferredKitEntries: ReadonlyArray<readonly [string, AnyNamespace]>
  ): unknown {
    const $ = { kit };
    augmentCtx($);
    // Spread happens with eager kit values only; deferred entries are added
    // below as lazy getters on both the kit object (for $.kit access) and
    // the top-level plugin (unless shadowed by a same-named dep).
    const plugin: AnyResolvedNamespaceMap = { ...kit, ...deps, $ };
    for (const [k, ns] of deferredKitEntries) {
      const getter = this.createDeferredKitGetter(ns, locale);
      Object.defineProperty(kit, k, { enumerable: true, configurable: true, get: getter });
      if (!(k in deps)) {
        Object.defineProperty(plugin, k, { enumerable: true, configurable: true, get: getter });
      }
    }
    return plugin;
  }

  // Dispose a slot from a given slot map. Used by invalidate (process tier
  // map), disposeVertex* (process tier or request scope, via slotsForLayout),
  // and disposeRequestScope (each request-scope map).
  protected disposeSlotIn(slotsMap: Map<string, Slot>, key: string): void {
    const slot = slotsMap.get(key);
    if (!slot) {
      return;
    }
    let teardownInvoked = false;
    if (!(slot.content instanceof Promise)) {
      const teardown = tryGetManagedTeardown(slot.content.res);
      if (teardown) {
        teardownInvoked = true;
        try {
          teardown();
        } catch (e) {
          console.error(e);
        }
      }
    }
    // In-flight: stale check at completion intercepts (slots.delete causes
    // identity mismatch and the resolved juncture is discarded with teardown).
    slotsMap.delete(key);
    this.busHost.bus?.emit({ type: "juncture:slotDisposed", namespace: slot.namespace, teardownInvoked });
  }

  // Back-compat shim: dispose from the process-tier slots map.
  protected disposeSlot(key: string): void {
    this.disposeSlotIn(this.slots, key);
  }

  invalidate(ns: AnyNamespace): void {
    // The closure is iterated in dispose-safe order: dependents first, ns last.
    // (See BlueprintManager.getReverseClosure.)
    const closure = this.blueprintManager.getReverseClosure(ns);
    this.busHost.bus?.emit({ type: "juncture:invalidationStart", rootNamespace: ns, closure: [...closure] });
    // 1. Bump generation for every namespace in the closure. An in-flight
    //    resolve started before this point will see the new generation at its
    //    completion check and discard its juncture.
    for (const n of closure) {
      this.generationByNs.set(n, (this.generationByNs.get(n) ?? 0) + 1);
    }
    // 2. Eager dispose of resolved slots in the closure (teardown invoked).
    //    Group slot keys by namespace once, then walk the closure in dispose
    //    order — A is disposed before B if A depends on B, so A's teardown
    //    can safely reference resources held by B.
    const keysByNs = new Map<AnyNamespace, string[]>();
    for (const slot of this.slots.values()) {
      if (closure.has(slot.namespace)) {
        let keys = keysByNs.get(slot.namespace);
        if (!keys) {
          keys = [];
          keysByNs.set(slot.namespace, keys);
        }
        keys.push(slot.key);
      }
    }
    for (const n of closure) {
      const keys = keysByNs.get(n);
      if (keys) {
        for (const key of keys) {
          this.disposeSlot(key);
        }
      }
    }
    // 3. Evict blueprints in the closure (must happen before notify so any
    //    re-resolve triggered by a subscriber callback loads fresh modules).
    for (const n of closure) {
      this.blueprintManager.evictBlueprint(n);
    }
    // 4. Notify subscribers. The "subscribersNotified" event fires BEFORE the
    //    callbacks run so the test transcript reads: notify → callback effects.
    for (const n of closure) {
      const subs = this.subscribersByNs.get(n);
      if (subs) {
        this.busHost.bus?.emit({
          type: "juncture:subscribersNotified",
          namespace: n,
          subscriberCount: subs.size,
        });
        for (const cb of subs) {
          try {
            cb();
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }

  subscribe(nsList: Iterable<AnyNamespace>, callback: () => void): () => void {
    const subscribed: AnyNamespace[] = [];
    for (const ns of nsList) {
      let set = this.subscribersByNs.get(ns);
      if (!set) {
        set = new Set();
        this.subscribersByNs.set(ns, set);
      }
      set.add(callback);
      subscribed.push(ns);
    }
    this.busHost.bus?.emit({ type: "juncture:subscribed", namespaces: subscribed });
    return () => {
      for (const ns of subscribed) {
        const set = this.subscribersByNs.get(ns);
        set?.delete(callback);
        if (set && set.size === 0) {
          this.subscribersByNs.delete(ns);
        }
      }
      this.busHost.bus?.emit({ type: "juncture:unsubscribed", namespaces: subscribed });
    };
  }

  disposeVertexSlot(ns: AnyNamespace, genId: number): void {
    const vertexIdx = this.vertexIndex();
    const set = vertexIdx.get(genId);
    if (!set?.has(ns)) {
      return;
    }
    set.delete(ns);
    if (set.size === 0) {
      vertexIdx.delete(genId);
    }
    const key = getJunctureResCacheKey(ns, undefined, "gear:outer(vertex)", genId);
    this.disposeSlotIn(this.slotsForLayout("gear:outer(vertex)"), key);
  }

  disposeAllVertexSlotsByGenId(genId: number): number {
    const vertexIdx = this.vertexIndex();
    const set = vertexIdx.get(genId);
    if (!set) {
      return 0;
    }
    const count = set.size;
    const slotsMap = this.slotsForLayout("gear:outer(vertex)");
    for (const ns of set) {
      const key = getJunctureResCacheKey(ns, undefined, "gear:outer(vertex)", genId);
      this.disposeSlotIn(slotsMap, key);
    }
    vertexIdx.delete(genId);
    return count;
  }

  disposeVertexSlotsByOwnershipChange(genId: number, newVertexGearMap: VertexGearMap | undefined): void {
    const set = this.vertexIndex().get(genId);
    if (!set) {
      return;
    }
    // Copy iteration source: disposeVertexSlot mutates the set.
    for (const ns of [...set]) {
      if (newVertexGearMap?.[ns] !== undefined) {
        this.disposeVertexSlot(ns, genId);
      }
    }
  }

  // Tears down all OuterGear slots that were resolved within this scope, in
  // reverse-topological order (dependents first). Used by adapter packages at
  // end of request to free per-request state (cells, setInterval handles,
  // listeners) while leaving the process-tier slots (Base/Inner/Shell)
  // untouched. Errors in individual teardowns are caught and logged so one
  // broken teardown doesn't abort the rest.
  disposeRequestScope(scope: RequestScope): void {
    // Collect all root namespaces present in the scope's Outer + Vertex maps.
    const roots = new Set<AnyNamespace>();
    for (const slot of scope.outerSlots.values()) roots.add(slot.namespace);
    for (const slot of scope.vertexSlots.values()) roots.add(slot.namespace);
    if (roots.size === 0) return;

    // Union of reverse closures preserving dispose-safe order. Set insertion
    // order is preserved; for a dependent that appears in multiple closures
    // its first encountered position wins — which already satisfies its own
    // topological constraint relative to its dependencies.
    const ordered = new Set<AnyNamespace>();
    for (const root of roots) {
      const closure = this.blueprintManager.getReverseClosure(root);
      for (const n of closure) ordered.add(n);
    }

    // Bucket scope slot keys by namespace once.
    const keysByNs = new Map<AnyNamespace, Array<{ key: string; map: Map<string, Slot> }>>();
    const bucket = (slot: Slot, map: Map<string, Slot>): void => {
      let arr = keysByNs.get(slot.namespace);
      if (!arr) {
        arr = [];
        keysByNs.set(slot.namespace, arr);
      }
      arr.push({ key: slot.key, map });
    };
    for (const slot of scope.outerSlots.values()) bucket(slot, scope.outerSlots);
    for (const slot of scope.vertexSlots.values()) bucket(slot, scope.vertexSlots);

    for (const n of ordered) {
      const arr = keysByNs.get(n);
      if (!arr) continue;
      for (const { key, map } of arr) {
        try {
          this.disposeSlotIn(map, key);
        } catch (e) {
          console.error("[r-machine] disposeRequestScope error for", n, e);
        }
      }
    }
    scope.vertexSlotsByGenId.clear();
    scope.wireCachesByPlugId.clear();
    this.busHost.bus?.emit({ type: "juncture:requestScopeDisposed" });
  }
}
