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

import { ERR_RESOLVE_FAILED, ERR_VERTEX_INSTANCE_NOT_FOUND, RMachineResolveError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { Blueprint } from "./blueprint.js";
import type { BlueprintManager } from "./blueprint-manager.js";
import { buildKernelJuncture, buildOuterJuncture, getCurrentSurface, type Juncture } from "./juncture.js";
import { tryGetManagedTeardown } from "./managed.js";
import type { AnyRes } from "./res.js";
import type { AnyNamespace, AnyNamespaceCollection } from "./res-domain.js";
import { getResCacheKey } from "./res-domain.js";
import type { AnyResEquipment, KitKind } from "./res-equipment.js";
import type { ResLayoutEntryTypeResolver } from "./res-layout.js";
import { type AnyNamespaceList, isNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap } from "./res-map.js";
import type { AnySurface } from "./surface.js";
import type { VertexGearMap, VertexGearTagData } from "./vertex-gear.js";

interface Slot {
  readonly key: string;
  readonly namespace: AnyNamespace;
  readonly generation: number;
  content: Juncture | Promise<Juncture>;
}

export class JunctureManager {
  constructor(
    protected resLayoutEntryTypeResolver: ResLayoutEntryTypeResolver,
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
    vertexTag: VertexGearTagData | undefined
  ): Promise<Juncture> {
    const generation = this.generationByNs.get(namespace) ?? 0;
    let slot!: Slot;
    const juncturePromise = (async () => {
      try {
        const layoutType = this.resLayoutEntryTypeResolver(namespace);
        const blueprint: Blueprint = await this.blueprintManager.getBlueprint(namespace, locale, layoutType, key);
        let juncture: Juncture;
        if (blueprint.originType === "res") {
          juncture = buildKernelJuncture(blueprint.origin as AnyRes, vertexTag);
        } else {
          const factory = blueprint.origin.factory as (
            locale: AnyLocale | undefined,
            selfNamespace: AnyNamespace
          ) => Promise<AnyRes>;
          const res = await factory(locale, namespace);
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
    vertexGearMap: VertexGearMap | undefined
  ): Promise<Juncture> {
    const layoutType = this.resLayoutEntryTypeResolver(namespace);
    if (layoutType === "gear:outer(vertex)") {
      const existingGenId = vertexGearMap?.[namespace];
      if (existingGenId !== undefined) {
        const consumerKey = getResCacheKey(namespace, locale, layoutType, existingGenId);
        const consumerSlot = this.slots.get(consumerKey);
        if (consumerSlot === undefined || !this.isSlotFresh(consumerSlot)) {
          throw new RMachineResolveError(
            ERR_VERTEX_INSTANCE_NOT_FOUND,
            `Vertex gear instance "${namespace}" with genId ${existingGenId} not found in JunctureManager cache.`
          );
        }
        return consumerSlot.content;
      }
      const creatorKey = getResCacheKey(namespace, locale, layoutType, genId);
      const creatorSlot = this.slots.get(creatorKey);
      if (creatorSlot !== undefined && this.isSlotFresh(creatorSlot)) {
        return creatorSlot.content;
      }
      const promise = this.resolveJuncture(namespace, locale, creatorKey, { namespace, genId });
      // Register vertex creation in genId index (idempotent set add).
      let vertexSet = this.vertexSlotsByGenId.get(genId);
      if (!vertexSet) {
        vertexSet = new Set();
        this.vertexSlotsByGenId.set(genId, vertexSet);
      }
      vertexSet.add(namespace);
      return promise;
    }

    const key = getResCacheKey(namespace, locale, layoutType);
    const cached = this.slots.get(key);
    if (cached !== undefined && this.isSlotFresh(cached)) {
      return cached.content;
    }
    return this.resolveJuncture(namespace, locale, key, undefined);
  }

  async getPlugin(
    kitKind: KitKind,
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale | undefined,
    selfNamespace: AnyNamespace | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined
  ): Promise<unknown> {
    const isList = isNamespaceList(nsDeps);
    const kitMap = this.equipment[`${kitKind}Kit` as keyof AnyResEquipment] as Record<string, AnyNamespace>;
    const entries = Object.entries(kitMap);
    let selfKitKey: string | undefined;
    const kitEntries = entries.filter(([key, ns]) => {
      if (ns === selfNamespace) {
        selfKitKey = key;
        return false;
      }
      return true;
    });

    const [kit, deps] = await Promise.all([
      this.loadKit(kitEntries, locale),
      isList
        ? this.loadListDeps(nsDeps, locale, genId, vertexGearMap)
        : this.loadMapDeps(nsDeps, locale, genId, vertexGearMap),
    ]);

    return isList
      ? this.buildListPlugin(kitKind, deps as unknown[], kit, locale, selfNamespace, selfKitKey)
      : this.buildMapPlugin(kitKind, deps as Record<string, unknown>, kit, locale, selfNamespace, selfKitKey);
  }

  protected createSelfRefGetter(selfNamespace: AnyNamespace, locale: AnyLocale | undefined): () => AnySurface {
    const selfLayoutType = this.resLayoutEntryTypeResolver(selfNamespace);
    const selfKey = getResCacheKey(selfNamespace, locale, selfLayoutType);
    return () => {
      const slot = this.slots.get(selfKey);
      if (slot === undefined || slot.content instanceof Promise) {
        throw new RMachineResolveError(
          ERR_RESOLVE_FAILED,
          `Kit self-reference "${selfNamespace}" is not available while its own factory is running.`
        );
      }
      return getCurrentSurface(slot.content);
    };
  }

  protected async loadKit(
    entries: ReadonlyArray<readonly [string, AnyNamespace]>,
    locale: AnyLocale | undefined
  ): Promise<Record<string, unknown>> {
    const resolved = await Promise.all(
      entries.map(async ([k, ns]) => [k, getCurrentSurface(await this.getJuncture(ns, locale, 0, undefined))] as const)
    );
    return Object.fromEntries(resolved);
  }

  protected async loadMapDeps(
    nsDeps: AnyNamespaceMap,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined
  ): Promise<Record<string, unknown>> {
    const entries = await Promise.all(
      Object.entries(nsDeps).map(async ([key, namespace]) => [
        key,
        getCurrentSurface(await this.getJuncture(namespace, locale, genId, vertexGearMap)),
      ])
    );
    return Object.fromEntries(entries);
  }

  protected async loadListDeps(
    nsDeps: AnyNamespaceList,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined
  ): Promise<unknown[]> {
    return Promise.all(
      nsDeps.map(async (namespace) =>
        getCurrentSurface(await this.getJuncture(namespace as AnyNamespace, locale, genId, vertexGearMap))
      )
    );
  }

  protected buildListPlugin(
    kitKind: KitKind,
    deps: unknown[],
    kit: Record<string, unknown>,
    locale: AnyLocale | undefined,
    selfNamespace: AnyNamespace | undefined,
    selfKitKey: string | undefined
  ): unknown {
    const ctx = kitKind === "shell" ? { locale, kit } : { kit };
    const plugin = [...deps, ctx];
    if (selfNamespace !== undefined && selfKitKey !== undefined) {
      const getter = this.createSelfRefGetter(selfNamespace, locale);
      Object.defineProperty(kit, selfKitKey, { enumerable: true, configurable: true, get: getter });
    }
    return plugin;
  }

  protected buildMapPlugin(
    kitKind: KitKind,
    deps: Record<string, unknown>,
    kit: Record<string, unknown>,
    locale: AnyLocale | undefined,
    selfNamespace: AnyNamespace | undefined,
    selfKitKey: string | undefined
  ): unknown {
    const ctx = kitKind === "shell" ? { locale, kit } : { kit };
    const plugin: Record<string, unknown> = { ...deps, ...kit, $: ctx };
    if (selfNamespace !== undefined && selfKitKey !== undefined) {
      const getter = this.createSelfRefGetter(selfNamespace, locale);
      Object.defineProperty(kit, selfKitKey, { enumerable: true, configurable: true, get: getter });
      if (!(selfKitKey in deps)) {
        Object.defineProperty(plugin, selfKitKey, { enumerable: true, configurable: true, get: getter });
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
    const key = getResCacheKey(ns, undefined, "gear:outer(vertex)", genId);
    this.disposeSlot(key);
  }

  disposeAllVertexSlotsByGenId(genId: number): void {
    const set = this.vertexSlotsByGenId.get(genId);
    if (!set) {
      return;
    }
    for (const ns of set) {
      const key = getResCacheKey(ns, undefined, "gear:outer(vertex)", genId);
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
