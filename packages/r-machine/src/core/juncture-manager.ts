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
import { buildKernelJuncture, buildOuterJuncture, getCurrentSurface, type Juncture } from "./juncture.js";
import { tryGetManagedTeardown } from "./managed.js";
import type { PluginCtxAugmenter } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyNamespace, AnyNamespaceCollection } from "./res-domain.js";
import type { AnyResEquipment } from "./res-equipment.js";
import type { ResLayoutEntryType, ResLayoutResolver } from "./res-layout.js";
import { type AnyNamespaceList, type AnyResolvedNamespaceList, isNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap, AnyResolvedNamespaceMap } from "./res-map.js";
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

interface Slot {
  readonly key: string;
  readonly namespace: AnyNamespace;
  readonly generation: number;
  content: Juncture | Promise<Juncture>;
}

export class JunctureManager {
  constructor(
    protected resLayoutResolver: ResLayoutResolver,
    protected equipment: AnyResEquipment,
    protected blueprintManager: BlueprintManager
  ) {
    blueprintManager.setOnInvalidate((ns) => this.invalidate(ns));
  }

  protected readonly slots = new Map<string, Slot>();
  protected readonly generationByNs = new Map<AnyNamespace, number>();
  protected readonly subscribersByNs = new Map<AnyNamespace, Set<() => void>>();
  protected readonly vertexSlotsByGenId = new Map<number, Set<AnyNamespace>>();

  protected resolveJuncture(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    key: string,
    vertexTag: VertexGearTagData | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<Juncture> {
    const generation = this.generationByNs.get(namespace) ?? 0;
    let slot!: Slot;
    const juncturePromise = (async () => {
      try {
        const layoutType = this.resLayoutResolver.resolveLayoutEntryType(namespace);
        const blueprint: Blueprint = await this.blueprintManager.getBlueprint(namespace, locale, layoutType, key);
        let juncture: Juncture;
        if (blueprint.originType === "res") {
          juncture = buildKernelJuncture(blueprint.origin as AnyRes, vertexTag);
        } else {
          const factory = blueprint.origin.factory as (
            locale: AnyLocale | undefined,
            chain: readonly AnyNamespace[]
          ) => Promise<AnyRes>;
          // Extend the chain with our own namespace before invoking the factory:
          // any nested loadKit / getJuncture under us will see us as in-flight
          // and break cycles via the deferred-kit getter. The "self" of the
          // running factory is implicitly chain[chain.length - 1].
          const res = await factory(locale, [...chain, namespace]);
          juncture = blueprint.isOuterGear ? buildOuterJuncture(res, vertexTag) : buildKernelJuncture(res, vertexTag);
        }
        // Stale check: generation mismatch (HMR happened) OR slot identity mismatch
        // (slot was disposed and possibly re-created during this resolve).
        const currentGen = this.generationByNs.get(namespace) ?? 0;
        if (currentGen !== generation || this.slots.get(key) !== slot) {
          try {
            tryGetManagedTeardown(juncture.res)?.();
          } catch (e) {
            console.error(e);
          }
          return juncture;
        }
        slot.content = juncture;
        return juncture;
      } catch (error) {
        if (this.slots.get(key) === slot) {
          this.slots.delete(key);
        }
        throw error;
      }
    })();
    slot = { key, namespace, generation, content: juncturePromise };
    this.slots.set(key, slot);
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
    if (layoutType === "gear:outer(vertex)") {
      const existingGenId = vertexGearMap?.[namespace];
      if (existingGenId !== undefined) {
        const consumerKey = getJunctureResCacheKey(namespace, locale, layoutType, existingGenId);
        const consumerSlot = this.slots.get(consumerKey);
        if (consumerSlot === undefined || !this.isSlotFresh(consumerSlot)) {
          throw new RMachineResolveError(
            ERR_VERTEX_INSTANCE_NOT_FOUND,
            `Vertex gear instance "${namespace}" with genId ${existingGenId} not found in JunctureManager cache.`
          );
        }
        return consumerSlot.content;
      }
      const creatorKey = getJunctureResCacheKey(namespace, locale, layoutType, genId);
      const creatorSlot = this.slots.get(creatorKey);
      if (creatorSlot !== undefined && this.isSlotFresh(creatorSlot)) {
        return creatorSlot.content;
      }
      // Register vertex creation in genId index before spawning the resolve,
      // so the index and slots map are populated together (resolveJuncture
      // creates the slot synchronously before returning the promise).
      let vertexSet = this.vertexSlotsByGenId.get(genId);
      if (!vertexSet) {
        vertexSet = new Set();
        this.vertexSlotsByGenId.set(genId, vertexSet);
      }
      vertexSet.add(namespace);
      return this.resolveJuncture(namespace, locale, creatorKey, { namespace, genId }, chain);
    }

    const key = getJunctureResCacheKey(namespace, locale, layoutType);
    const cached = this.slots.get(key);
    if (cached !== undefined && this.isSlotFresh(cached)) {
      return cached.content;
    }
    return this.resolveJuncture(namespace, locale, key, undefined, chain);
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
      const slot = this.slots.get(slotKey);
      if (slot === undefined || slot.content instanceof Promise) {
        throw new RMachineResolveError(
          ERR_CIRCULAR_DEPENDENCY,
          `Kit access on "${namespace}" is not available: that namespace is currently being resolved as a transitive ancestor.`
        );
      }
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

  protected disposeSlot(key: string): void {
    const slot = this.slots.get(key);
    if (!slot) {
      return;
    }
    if (!(slot.content instanceof Promise)) {
      try {
        tryGetManagedTeardown(slot.content.res)?.();
      } catch (e) {
        console.error(e);
      }
    }
    // In-flight: stale check at completion intercepts (slots.delete causes
    // identity mismatch and the resolved juncture is discarded with teardown).
    this.slots.delete(key);
  }

  invalidate(ns: AnyNamespace): void {
    // The closure is iterated in dispose-safe order: dependents first, ns last.
    // (See BlueprintManager.getReverseClosure.)
    const closure = this.blueprintManager.getReverseClosure(ns);
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
    // 4. Notify subscribers.
    for (const n of closure) {
      const subs = this.subscribersByNs.get(n);
      if (subs) {
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
    return () => {
      for (const ns of subscribed) {
        const set = this.subscribersByNs.get(ns);
        set?.delete(callback);
        if (set && set.size === 0) {
          this.subscribersByNs.delete(ns);
        }
      }
    };
  }

  disposeVertexSlot(ns: AnyNamespace, genId: number): void {
    const set = this.vertexSlotsByGenId.get(genId);
    if (!set?.has(ns)) {
      return;
    }
    set.delete(ns);
    if (set.size === 0) {
      this.vertexSlotsByGenId.delete(genId);
    }
    const key = getJunctureResCacheKey(ns, undefined, "gear:outer(vertex)", genId);
    this.disposeSlot(key);
  }

  disposeAllVertexSlotsByGenId(genId: number): void {
    const set = this.vertexSlotsByGenId.get(genId);
    if (!set) {
      return;
    }
    for (const ns of set) {
      const key = getJunctureResCacheKey(ns, undefined, "gear:outer(vertex)", genId);
      this.disposeSlot(key);
    }
    this.vertexSlotsByGenId.delete(genId);
  }

  disposeVertexSlotsByOwnershipChange(genId: number, newVertexGearMap: VertexGearMap | undefined): void {
    const set = this.vertexSlotsByGenId.get(genId);
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
}
