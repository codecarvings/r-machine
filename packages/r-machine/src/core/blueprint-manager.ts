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
import { ERR_RESOLVE_FAILED } from "../errors/error-codes.js";
import { RMachineResolveError } from "../errors/r-machine-resolve-error.js";
import { type Blueprint, createBlueprint } from "./blueprint.js";
import {
  type AnyResLayout,
  createResLayoutEntryTypeResolver,
  type ResLayoutEntryType,
  type ResLayoutEntryTypeResolver,
  resolveResPath,
} from "./res-layout.js";
import { type AnyResModule, type ResModuleLoaderFn, validateResModule } from "./res-module.js";

type BlueprintByLocale = Map<AnyLocale | undefined, Blueprint | Promise<Blueprint>>;

export class BlueprintManager {
  constructor(
    layout: AnyResLayout,
    protected loadResModuleFn: ResModuleLoaderFn
  ) {
    this.resLayoutEntryTypeResolver = createResLayoutEntryTypeResolver(layout);
  }

  protected readonly resLayoutEntryTypeResolver: ResLayoutEntryTypeResolver;
  protected readonly cache = new Map<AnyNamespace, BlueprintByLocale>();

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
    byLocale: BlueprintByLocale,
    resLayoutEntryType: ResLayoutEntryType
  ): Promise<Blueprint> {
    const blueprintPromise = (async () => {
      try {
        const module = await this.loadModule(namespace, locale, resLayoutEntryType);
        const blueprint = createBlueprint(module, namespace, locale, resLayoutEntryType);
        byLocale.set(locale, blueprint);
        return blueprint;
      } catch (error) {
        byLocale.delete(locale);
        throw error;
      }
    })();
    byLocale.set(locale, blueprintPromise);
    return blueprintPromise;
  }

  async getBlueprint(namespace: AnyNamespace, locale: AnyLocale | undefined): Promise<Blueprint> {
    const resLayoutEntryType = this.resLayoutEntryTypeResolver(namespace);
    if (!resLayoutEntryType) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Failed to resolve blueprint for namespace "${namespace}" and locale "${locale ?? "default"}" - no matching layout entry found.`
      );
    }

    if (resLayoutEntryType !== "shell") {
      locale = undefined;
    }

    let byLocale = this.cache.get(namespace);
    if (byLocale !== undefined) {
      const blueprint = byLocale.get(locale);
      if (blueprint !== undefined) {
        return blueprint;
      }
    } else {
      byLocale = new Map();
      this.cache.set(namespace, byLocale);
    }

    return this.resolveBlueprint(namespace, locale, byLocale, resLayoutEntryType);
  }
}
