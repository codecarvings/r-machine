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

import type { AnyLocale } from "#r-machine/locale";
import { ERR_RESOLVE_FAILED } from "../errors/error-codes.js";
import { RMachineResolveError } from "../errors/r-machine-resolve-error.js";
import type { KernelManager } from "./kernel-manager.js";
import type { AnyNamespace } from "./res-domain.js";
import type { AnyResEquipment, KitKind } from "./res-equipment.js";
import { type AnyNamespaceList, isNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap } from "./res-map.js";

function getKitKey(kitKind: KitKind, locale: AnyLocale | undefined): string {
  if (locale) {
    return `${kitKind}:${locale}`;
  } else {
    return `${kitKind}`;
  }
}

export class KernelPluginManager {
  constructor(
    protected equipment: AnyResEquipment,
    protected kernelManager: KernelManager
  ) {}

  protected kits: Map<string, Record<string, unknown> | Promise<Record<string, unknown>>> = new Map();

  protected async loadMapDeps(
    nsDeps: AnyNamespaceMap,
    locale: AnyLocale | undefined
  ): Promise<Record<string, unknown>> {
    const entries = await Promise.all(
      Object.entries(nsDeps).map(async ([key, namespace]) => [
        key,
        await this.kernelManager.getKernel(namespace as AnyNamespace, locale),
      ])
    );
    return Object.fromEntries(entries);
  }

  protected async loadListDeps(nsDeps: AnyNamespaceList, locale: AnyLocale | undefined): Promise<unknown[]> {
    return Promise.all(nsDeps.map((namespace) => this.kernelManager.getKernel(namespace as AnyNamespace, locale)));
  }

  protected async resolveKit(
    kitKind: KitKind,
    locale: AnyLocale | undefined,
    key: string
  ): Promise<Record<string, unknown>> {
    const kitPromise = (async () => {
      try {
        const kitMap = this.equipment[`${kitKind}Kit` as keyof AnyResEquipment];
        const kit = await this.loadMapDeps(kitMap, locale);
        this.kits.set(key, kit);
        return kit;
      } catch (error) {
        this.kits.delete(key);
        throw error;
      }
    })();
    this.kits.set(key, kitPromise);
    return kitPromise;
  }

  protected async getKit(kitKind: KitKind, locale: AnyLocale | undefined): Promise<Record<string, unknown>> {
    const key = getKitKey(kitKind, locale);
    let kit = this.kits.get(key);
    if (!kit) {
      kit = await this.resolveKit(kitKind, locale, key);
    }
    return kit;
  }

  async getPlugin(
    kitKind: KitKind,
    nsDeps: AnyNamespaceMap | AnyNamespaceList,
    locale: AnyLocale | undefined
  ): Promise<unknown> {
    const kit = await this.getKit(kitKind, locale);
    const isList = isNamespaceList(nsDeps);
    if (isList) {
      const listDeps = await this.loadListDeps(nsDeps, locale);
      return this.buildListPlugin(kitKind, listDeps, kit, locale);
    } else {
      const mapDeps = await this.loadMapDeps(nsDeps, locale);
      return this.buildMapPlugin(kitKind, mapDeps, kit, locale);
    }
  }

  getPluginSync(kitKind: KitKind, nsDeps: AnyNamespaceMap | AnyNamespaceList, locale: AnyLocale | undefined): unknown {
    const kitKey = getKitKey(kitKind, locale);
    const kit = this.kits.get(kitKey);
    if (!kit) {
      throw new RMachineResolveError(ERR_RESOLVE_FAILED, `Plugin kit "${kitKind}" is not loaded yet.`);
    }
    if (kit instanceof Promise) {
      throw new RMachineResolveError(ERR_RESOLVE_FAILED, `Plugin kit "${kitKind}" is still loading.`);
    }

    const isList = isNamespaceList(nsDeps);
    if (isList) {
      const listDeps = nsDeps.map((namespace) => this.kernelManager.getKernelSync(namespace, locale));
      return this.buildListPlugin(kitKind, listDeps, kit, locale);
    } else {
      const mapDeps: Record<string, unknown> = {};
      for (const [key, namespace] of Object.entries(nsDeps)) {
        mapDeps[key] = this.kernelManager.getKernelSync(namespace as AnyNamespace, locale);
      }
      return this.buildMapPlugin(kitKind, mapDeps, kit, locale);
    }
  }

  protected buildListPlugin(
    kitKind: KitKind,
    deps: unknown[],
    kit: Record<string, unknown>,
    locale: AnyLocale | undefined
  ): unknown {
    const ctx = kitKind === "shell" ? { locale, kit } : { kit };
    return [...deps, ctx];
  }

  protected buildMapPlugin(
    kitKind: KitKind,
    deps: Record<string, unknown>,
    kit: Record<string, unknown>,
    locale: AnyLocale | undefined
  ): unknown {
    const ctx = kitKind === "shell" ? { locale, kit } : { kit };
    return { ...deps, ...kit, ...{ $: ctx } };
  }
}
