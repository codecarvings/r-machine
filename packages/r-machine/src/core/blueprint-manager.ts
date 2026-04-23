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
import type { ResFamily } from "./res.js";
import type { AnyNamespace } from "./res-domain.js";
import { getResCacheKey } from "./res-domain.js";
import type { KitDepLists } from "./res-equipment.js";
import { type ResLayoutEntryType, type ResLayoutEntryTypeResolver, resolveResPath } from "./res-layout.js";
import type { AnyNamespaceList } from "./res-list.js";
import {
  type AnyResModule,
  type ResModuleLoaderFn,
  type ResModuleLoaderFnOptions,
  validateResModule,
} from "./res-module.js";

export class BlueprintManager {
  constructor(
    protected resLayoutEntryTypeResolver: ResLayoutEntryTypeResolver,
    protected kitDepList: KitDepLists,
    protected loadResModuleFn: ResModuleLoaderFn
  ) {}

  protected readonly cache = new Map<string, Blueprint | Promise<Blueprint>>();

  protected async loadModule(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    layoutEntryType: ResLayoutEntryType
  ): Promise<AnyResModule> {
    const path = resolveResPath(namespace, locale, layoutEntryType);
    const options: ResModuleLoaderFnOptions = {
      namespace,
      locale,
      onUpdate: () => {},
    };
    const module = await this.loadResModuleFn(path, options);
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
    chain: ReadonlyArray<string>
  ): Promise<void> {
    const kitDeps = this.kitDepList[family].filter((n) => n !== namespace);
    const allNsDeps = [...new Set([...nsDepList, ...kitDeps])];

    await Promise.all(
      allNsDeps.map((depNs) => {
        const depLayout = this.resLayoutEntryTypeResolver(depNs);
        const depKey = getResCacheKey(depNs, locale, depLayout);
        return this.getBlueprintInternal(depNs, locale, depLayout, depKey, chain);
      })
    );
  }

  protected resolveBlueprint(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    key: string,
    resLayoutEntryType: ResLayoutEntryType,
    chain: ReadonlyArray<string>
  ): Promise<Blueprint> {
    const blueprintPromise = (async () => {
      try {
        const module = await this.loadModule(namespace, locale, resLayoutEntryType);
        const blueprint = createBlueprint(module, namespace, locale, resLayoutEntryType);
        if (blueprint.originType === "res-matrix") {
          await this.loadDepsBlueprints(namespace, blueprint.family, locale, blueprint.plugHead!.nsDepList, [
            ...chain,
            key,
          ]);
        }
        this.cache.set(key, blueprint);
        return blueprint;
      } catch (error) {
        this.cache.delete(key);
        throw error;
      }
    })();
    this.cache.set(key, blueprintPromise);
    return blueprintPromise;
  }

  protected async getBlueprintInternal(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    resLayoutEntryType: ResLayoutEntryType,
    key: string,
    chain: ReadonlyArray<string>
  ): Promise<Blueprint> {
    if (chain.includes(key)) {
      const path = [...chain, key].join(" -> ");
      throw new RMachineResolveError(ERR_CIRCULAR_DEPENDENCY, `Circular blueprint dependency detected: ${path}.`);
    }

    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    return this.resolveBlueprint(namespace, locale, key, resLayoutEntryType, chain);
  }

  async getBlueprint(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    resLayoutEntryType: ResLayoutEntryType,
    key: string
  ): Promise<Blueprint> {
    return this.getBlueprintInternal(namespace, locale, resLayoutEntryType, key, []);
  }
}
