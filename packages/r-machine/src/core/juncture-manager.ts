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
import { buildReactiveJuncture, buildStaticJuncture, getCurrentSurface, type Juncture } from "./juncture.js";
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

export class JunctureManager {
  constructor(
    protected resLayoutEntryTypeResolver: ResLayoutEntryTypeResolver,
    protected equipment: AnyResEquipment,
    protected blueprintManager: BlueprintManager
  ) {}

  protected readonly junctures = new Map<string, Juncture | Promise<Juncture>>();
  protected readonly vertexJuncturesByGenId = new Map<number, Map<AnyNamespace, string>>();
  protected readonly pendingDisposeKeys = new Set<string>();

  protected resolveJuncture(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    key: string,
    vertexTag: VertexGearTagData | undefined
  ): Promise<Juncture> {
    const juncturePromise = (async () => {
      try {
        const layoutType = this.resLayoutEntryTypeResolver(namespace);
        const blueprint: Blueprint = await this.blueprintManager.getBlueprint(namespace, locale, layoutType, key);
        let juncture: Juncture;
        if (blueprint.originType === "res") {
          juncture = buildStaticJuncture(blueprint.origin as AnyRes, vertexTag);
        } else {
          const factory = blueprint.origin.factory as (
            locale: AnyLocale | undefined,
            selfNamespace: AnyNamespace
          ) => Promise<AnyRes>;
          const res = await factory(locale, namespace);
          juncture = blueprint.isReactive ? buildReactiveJuncture(res, vertexTag) : buildStaticJuncture(res, vertexTag);
        }
        this.junctures.set(key, juncture);
        if (this.pendingDisposeKeys.has(key)) {
          this.pendingDisposeKeys.delete(key);
          this.disposeJuncture(key);
        }
        return juncture;
      } catch (error) {
        this.junctures.delete(key);
        this.pendingDisposeKeys.delete(key);
        if (vertexTag !== undefined) {
          const map = this.vertexJuncturesByGenId.get(vertexTag.genId);
          if (map !== undefined) {
            map.delete(vertexTag.namespace);
            if (map.size === 0) {
              this.vertexJuncturesByGenId.delete(vertexTag.genId);
            }
          }
        }
        throw error;
      }
    })();
    this.junctures.set(key, juncturePromise);
    if (vertexTag !== undefined) {
      let map = this.vertexJuncturesByGenId.get(vertexTag.genId);
      if (map === undefined) {
        map = new Map();
        this.vertexJuncturesByGenId.set(vertexTag.genId, map);
      }
      map.set(vertexTag.namespace, key);
    }
    return juncturePromise;
  }

  protected async getJuncture(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined
  ): Promise<Juncture> {
    const layoutType = this.resLayoutEntryTypeResolver(namespace);
    if (layoutType === "gear:vertex") {
      const existingGenId = vertexGearMap?.[namespace];
      if (existingGenId !== undefined) {
        const consumerKey = getResCacheKey(namespace, locale, layoutType, existingGenId);
        const consumerCached = this.junctures.get(consumerKey);
        if (consumerCached === undefined) {
          throw new RMachineResolveError(
            ERR_VERTEX_INSTANCE_NOT_FOUND,
            `Vertex gear instance "${namespace}" with genId ${existingGenId} not found in JunctureManager cache.`
          );
        }
        return consumerCached;
      }
      const creatorKey = getResCacheKey(namespace, locale, layoutType, genId);
      const creatorCached = this.junctures.get(creatorKey);
      if (creatorCached !== undefined) {
        // Re-acquisition: cancel any pending dispose, and re-populate the index
        // (idempotent on the happy path, restorative after an A→B→A flip).
        this.pendingDisposeKeys.delete(creatorKey);
        let map = this.vertexJuncturesByGenId.get(genId);
        if (map === undefined) {
          map = new Map();
          this.vertexJuncturesByGenId.set(genId, map);
        }
        map.set(namespace, creatorKey);
        return creatorCached;
      }
      return this.resolveJuncture(namespace, locale, creatorKey, { namespace, genId });
    }

    const key = getResCacheKey(namespace, locale, layoutType);
    const cached = this.junctures.get(key);
    if (cached !== undefined) {
      return cached;
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
      const cached = this.junctures.get(selfKey);
      if (cached === undefined || cached instanceof Promise) {
        throw new RMachineResolveError(
          ERR_RESOLVE_FAILED,
          `Kit self-reference "${selfNamespace}" is not available while its own factory is running.`
        );
      }
      return getCurrentSurface(cached);
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

  protected disposeJuncture(key: string): void {
    const cached = this.junctures.get(key);
    if (cached === undefined) {
      return;
    }
    if (cached instanceof Promise) {
      this.pendingDisposeKeys.add(key);
      return;
    }

    try {
      tryGetManagedTeardown(cached.res)?.();
    } catch (e) {
      console.error(e);
    }
    this.junctures.delete(key);
  }

  disposeVertexJunctures(genId: number): void {
    const map = this.vertexJuncturesByGenId.get(genId);
    if (map === undefined) {
      return;
    }

    for (const key of map.values()) {
      this.disposeJuncture(key);
    }
    this.vertexJuncturesByGenId.delete(genId);
  }

  disposeVertexJuncturesByOwnershipChange(genId: number, newVertexGearMap: VertexGearMap | undefined): void {
    const map = this.vertexJuncturesByGenId.get(genId);
    if (map === undefined) {
      return;
    }

    for (const [ns, key] of map) {
      // Dispose previous vertex junctures if newVertexGearMap indicates to use a parent instance
      if (newVertexGearMap?.[ns] !== undefined) {
        this.disposeJuncture(key);
        map.delete(ns);
      }
    }
    if (map.size === 0) {
      this.vertexJuncturesByGenId.delete(genId);
    }
  }
}
