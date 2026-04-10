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

import type { AnyResourceOrigin } from "./resource.js";
import type { AnyNamespace } from "./resource-atlas.js";

export interface AnyModule {
  readonly r: AnyResourceOrigin;
}

export type ModuleLoader = (path: string, namespace: AnyNamespace, locale: string) => Promise<AnyModule>;

/*

function getResolveRFromModuleError(
  namespace: AnyNamespace,
  locale: AnyLocale,
  reason: string,
  innerError?: Error | undefined
) {
  return new RMachineResolveError(
    ERR_RESOLVE_FAILED,
    `Unable to resolve resource "${namespace}" for locale "${locale}" - ${reason}.`,
    innerError
  );
}

// TODO: WIP
export async function resolveRFromModule(rModule: AnyRModule, $: any): Promise<AnyR> {
  if (!rModule || typeof rModule !== "object") {
    throw getResolveRFromModuleError($.namespace, $.locale, "module is not an object");
  }

  const rForge = rModule.r;
  const rForgeType = typeof rForge;

  if (rForgeType === "function") {
    let r: AnyR;
    try {
      r = await (rForge as AnyRFactory)();
    } catch (reason) {
      throw getResolveRFromModuleError($.namespace, $.locale, "factory promise rejected", reason as Error);
    }

    const rType = typeof r;
    if (rType !== "object" || r === null) {
      throw getResolveRFromModuleError(
        $.namespace,
        $.locale,
        r === null ? "resource returned by factory is null" : `invalid resource type returned by factory (${rType})`
      );
    }
    return r;
  }

  if (rForgeType === "object") {
    if (rForge !== null) {
      return rForge;
    }
    throw getResolveRFromModuleError($.namespace, $.locale, "exported resource is null");
  }

  throw getResolveRFromModuleError($.namespace, $.locale, `invalid export type (${rForgeType})`);
}

export async function resolveR(loadModule: RModuleLoader, namespace: AnyNamespace, locale: AnyLocale): Promise<AnyR> {
  let rModule: AnyRModule;
  try {
    rModule = await loadModule(namespace, locale);
  } catch (reason) {
    throw new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Unable to resolve resource module "${namespace}" for locale "${locale}" - loadModule failed.`,
      reason as Error
    );
  }
  return resolveRFromModule(rModule, { namespace, locale });
}


*/
