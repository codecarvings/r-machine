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
import type { Kernel } from "./kernel.js";
import type { AnyNamespace } from "./res-domain.js";
import { getResCacheKey } from "./res-domain.js";
import type { ResLayoutEntryType, ResLayoutEntryTypeResolver } from "./res-layout.js";

export class KernelManager {
  constructor(
    protected resLayoutEntryTypeResolver: ResLayoutEntryTypeResolver,
    protected blueprintManager: BlueprintManager
  ) {}

  protected readonly cache = new Map<string, Kernel | Promise<Kernel>>();

  protected async createKernel(blueprint: Blueprint, locale: AnyLocale | undefined): Promise<Kernel> {
    if (blueprint.originType === "res") {
      return blueprint.origin as Kernel;
    }

    const namespaces = blueprint.plugHead!.nsDepList;
    if (namespaces.length > 0) {
      // Preload all dependencies before the kernel factory is invoked
      const blueprints = await Promise.all(namespaces.map((namespace) => this.getDepBlueprint(namespace, locale)));
      const missingDeps = blueprints
        .map((bp, index) => (bp ? undefined : namespaces[index]))
        .filter((ns): ns is AnyNamespace => ns !== undefined);
      if (missingDeps.length > 0) {
        throw new RMachineResolveError(
          ERR_RESOLVE_FAILED,
          `Unable to create ${blueprint.family} "${blueprint.namespace}" - failed to resolve dependencies: ${JSON.stringify(missingDeps)}.`
        );
      }
    }

    const kernel = await (blueprint.origin.factory as () => Promise<Kernel>)();
    return kernel;
  }

  protected getDepBlueprint(namespace: AnyNamespace, locale: AnyLocale | undefined): Promise<Blueprint> {
    const resLayoutEntryType = this.resLayoutEntryTypeResolver(namespace);
    const key = getResCacheKey(namespace, locale, resLayoutEntryType);
    return this.blueprintManager.getBlueprint(namespace, locale, resLayoutEntryType, key);
  }

  protected resolveKernel(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    resLayoutEntryType: ResLayoutEntryType,
    key: string
  ): Promise<Kernel> {
    const kernelPromise = (async () => {
      try {
        const blueprint = await this.blueprintManager.getBlueprint(namespace, locale, resLayoutEntryType, key);
        const kernel = await this.createKernel(blueprint, locale);
        this.cache.set(key, kernel);
        return kernel;
      } catch (error) {
        this.cache.delete(key);
        throw error;
      }
    })();
    this.cache.set(key, kernelPromise);
    return kernelPromise;
  }

  async getKernel(namespace: AnyNamespace, locale: AnyLocale | undefined): Promise<Kernel> {
    const resLayoutEntryType = this.resLayoutEntryTypeResolver(namespace);
    const key = getResCacheKey(namespace, locale, resLayoutEntryType);
    const kernel = this.cache.get(key);
    if (kernel !== undefined) {
      return kernel;
    }

    return this.resolveKernel(namespace, locale, resLayoutEntryType!, key);
  }

  getKernelSync(namespace: AnyNamespace, locale: AnyLocale | undefined): Kernel {
    const resLayoutEntryType = this.resLayoutEntryTypeResolver(namespace);
    const key = getResCacheKey(namespace, locale, resLayoutEntryType);
    const kernel = this.cache.get(key);
    if (kernel === undefined) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Kernel for namespace "${namespace}" ${locale ? `and locale "${locale}" ` : ""}is not loaded yet.`
      );
    }
    if (kernel instanceof Promise) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Kernel for namespace "${namespace}" ${locale ? `and locale "${locale}" ` : ""}is still loading.`
      );
    }
    return kernel;
  }
}
