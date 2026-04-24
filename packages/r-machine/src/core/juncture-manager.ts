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

import { ERR_RESOLVE_FAILED, RMachineResolveError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { Blueprint } from "./blueprint.js";
import type { BlueprintManager } from "./blueprint-manager.js";
import { buildReactiveJuncture, buildStaticJuncture, getCurrentSurface, type Juncture } from "./juncture.js";
import type { AnyRes } from "./res.js";
import type { AnyNamespace, AnyNamespaceCollection } from "./res-domain.js";
import { getResCacheKey } from "./res-domain.js";
import type { AnyResEquipment, KitKind } from "./res-equipment.js";
import type { ResLayoutEntryTypeResolver } from "./res-layout.js";
import { type AnyNamespaceList, isNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap } from "./res-map.js";
import type { AnySurface } from "./surface.js";

export class JunctureManager {
  constructor(
    protected resLayoutEntryTypeResolver: ResLayoutEntryTypeResolver,
    protected equipment: AnyResEquipment,
    protected blueprintManager: BlueprintManager
  ) {}

  protected readonly junctures = new Map<string, Juncture | Promise<Juncture>>();

  protected resolveJuncture(namespace: AnyNamespace, locale: AnyLocale | undefined, key: string): Promise<Juncture> {
    const juncturePromise = (async () => {
      try {
        const layoutType = this.resLayoutEntryTypeResolver(namespace);
        const blueprint: Blueprint = await this.blueprintManager.getBlueprint(namespace, locale, layoutType, key);
        let juncture: Juncture;
        if (blueprint.originType === "res") {
          juncture = buildStaticJuncture(blueprint.origin as AnyRes);
        } else {
          const factory = blueprint.origin.factory as (
            locale: AnyLocale | undefined,
            selfNamespace: AnyNamespace
          ) => Promise<AnyRes>;
          const res = await factory(locale, namespace);
          juncture = blueprint.isReactive ? buildReactiveJuncture(res) : buildStaticJuncture(res);
        }
        this.junctures.set(key, juncture);
        return juncture;
      } catch (error) {
        this.junctures.delete(key);
        throw error;
      }
    })();
    this.junctures.set(key, juncturePromise);
    return juncturePromise;
  }

  protected async getJuncture(namespace: AnyNamespace, locale: AnyLocale | undefined): Promise<Juncture> {
    const layoutType = this.resLayoutEntryTypeResolver(namespace);
    const key = getResCacheKey(namespace, locale, layoutType);
    const cached = this.junctures.get(key);
    if (cached !== undefined) {
      return cached;
    }
    return this.resolveJuncture(namespace, locale, key);
  }

  async getPlugin(
    kitKind: KitKind,
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale | undefined,
    selfNamespace?: AnyNamespace | undefined
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
      isList ? this.loadListDeps(nsDeps, locale) : this.loadMapDeps(nsDeps, locale),
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
      entries.map(async ([k, ns]) => [k, getCurrentSurface(await this.getJuncture(ns, locale))] as const)
    );
    return Object.fromEntries(resolved);
  }

  protected async loadMapDeps(
    nsDeps: AnyNamespaceMap,
    locale: AnyLocale | undefined
  ): Promise<Record<string, unknown>> {
    const entries = await Promise.all(
      Object.entries(nsDeps).map(async ([key, namespace]) => [
        key,
        getCurrentSurface(await this.getJuncture(namespace, locale)),
      ])
    );
    return Object.fromEntries(entries);
  }

  protected async loadListDeps(nsDeps: AnyNamespaceList, locale: AnyLocale | undefined): Promise<unknown[]> {
    return Promise.all(
      nsDeps.map(async (namespace) => getCurrentSurface(await this.getJuncture(namespace as AnyNamespace, locale)))
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
}
