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

import type { AnyNamespace } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import { type Blueprint, createBlueprint } from "./blueprint.js";
import { type ResLayoutEntryType, resolveResPath } from "./res-layout.js";
import { type AnyResModule, type ResModuleLoaderFn, validateResModule } from "./res-module.js";

export class BlueprintManager {
  constructor(protected loadResModuleFn: ResModuleLoaderFn) {}

  protected readonly cache = new Map<string, Blueprint | Promise<Blueprint>>();

  protected async loadModule(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    layoutEntryType: ResLayoutEntryType
  ): Promise<AnyResModule> {
    const path = resolveResPath(namespace, locale, layoutEntryType);
    const module = await this.loadResModuleFn(path, namespace, locale);
    const error = validateResModule(module);
    if (error) {
      throw error;
    }
    return module;
  }

  protected resolveBlueprint(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    key: string,
    resLayoutEntryType: ResLayoutEntryType
  ): Promise<Blueprint> {
    const blueprintPromise = (async () => {
      try {
        const module = await this.loadModule(namespace, locale, resLayoutEntryType);
        const blueprint = createBlueprint(module, namespace, locale, resLayoutEntryType);
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

  async getBlueprint(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    resLayoutEntryType: ResLayoutEntryType,
    key: string
  ): Promise<Blueprint> {
    const blueprint = this.cache.get(key);
    if (blueprint !== undefined) {
      return blueprint;
    }

    return this.resolveBlueprint(namespace, locale, key, resLayoutEntryType);
  }
}
