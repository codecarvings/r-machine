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
import type { Blueprint } from "./blueprint.js";
import type { BlueprintManager } from "./blueprint-manager.js";
import type { Kernel } from "./kernel.js";
import type { AnyNamespace } from "./res-domain.js";
import { getResCacheKey } from "./res-domain.js";
import type { ResLayoutEntryType } from "./res-layout.js";
import { type ResLayoutEntryTypeResolver, validateResLayoutEntry } from "./res-layout.js";

export class KernelManager {
  constructor(
    protected resLayoutEntryTypeResolver: ResLayoutEntryTypeResolver,
    protected blueprintManager: BlueprintManager
  ) {}

  protected readonly cache = new Map<string, Kernel | Promise<Kernel>>();

  protected async createKernel(blueprint: Blueprint): Promise<Kernel> {
    if (blueprint.originType === "res") {
      return blueprint.origin as Kernel;
    }
    const kernel = await (blueprint.origin.factory as () => Promise<Kernel>)();
    return kernel;
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
        const kernel = await this.createKernel(blueprint);
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
    locale = validateResLayoutEntry(namespace, locale, resLayoutEntryType);
    const key = getResCacheKey(namespace, locale);
    const kernel = this.cache.get(key);
    if (kernel !== undefined) {
      return kernel;
    }

    return this.resolveKernel(namespace, locale, resLayoutEntryType!, key);
  }
}
