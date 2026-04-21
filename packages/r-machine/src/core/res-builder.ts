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

import {
  type AnyResLayout,
  createResLayoutEntryTypeResolver,
  createResPathResolver,
  type ResLayoutEntryTypeResolver,
  type ResPathResolver,
} from "./res-layout.js";
import {
  createResModuleLoader,
  type ResModuleLoader,
  type ResModuleLoaderFn,
  validateResModule,
} from "./res-module.js";
import { createResPod } from "./res-pod.js";

export class ResBuilder {
  constructor(
    protected layout: AnyResLayout,
    protected loadResModuleFn: ResModuleLoaderFn
  ) {
    this.resLayoutEntryTypeResolver = createResLayoutEntryTypeResolver(layout);
    this.resPathResolver = createResPathResolver(this.resLayoutEntryTypeResolver);
    this.resModuleLoader = createResModuleLoader(this.resPathResolver, loadResModuleFn);
  }

  protected readonly resLayoutEntryTypeResolver: ResLayoutEntryTypeResolver;
  protected readonly resPathResolver: ResPathResolver;
  protected readonly resModuleLoader: ResModuleLoader;

  async loadModule(namespace: string, locale: string | undefined) {
    const result = await this.resModuleLoader(namespace, locale);
    const error = validateResModule(result);
    if (error) {
      throw error;
    }
    return result;
  }

  async createPod(namespace: string, locale: string | undefined) {
    const module = await this.loadModule(namespace, locale);
    const resLayoutEntryType = this.resLayoutEntryTypeResolver(namespace);
    return createResPod(module, namespace, locale, resLayoutEntryType!);
  }
}
