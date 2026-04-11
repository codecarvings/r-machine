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
import type { AnyNamespace } from "./res-atlas.js";
import type { ResourceFamily } from "./resource.js";

// #region ResLayout

export type ResLayoutType = ResourceFamily | "dynamic-shell";

export interface AnyResLayout {
  readonly [namespacePrefix: string]: ResLayoutType;
}

type LayoutEntry = readonly [prefix: string, type: ResLayoutType];

export type ResLayoutResolver = (namespace: AnyNamespace) => ResLayoutType | undefined;

export function createResLayoutResolver(layout: AnyResLayout): ResLayoutResolver {
  const entries: readonly LayoutEntry[] = Object.entries(layout).sort(([a], [b]) => b.length - a.length);
  const cache = new Map<string, ResLayoutType | undefined>();

  return function resolveResLayout(namespace) {
    if (cache.has(namespace)) return cache.get(namespace);
    const type = entries.find(([prefix]) => isPrefixMatch(namespace, prefix))?.[1];
    cache.set(namespace, type);
    return type;
  };
}

function isPrefixMatch(namespace: string, prefix: string): boolean {
  if (namespace === prefix) return true;
  return namespace.length > prefix.length && namespace.startsWith(prefix) && namespace[prefix.length] === "/";
}

// #endregion

// #region PathResolver

export type PathResolver = (namespace: AnyNamespace, locale: AnyLocale | undefined) => string;

export function createPathResolver(resolveResLayout: ResLayoutResolver): PathResolver {
  return function resolvePath(namespace, locale) {
    const layoutType = resolveResLayout(namespace);
    switch (layoutType) {
      case "gear":
      case "dynamic-shell":
        return namespace;
      case "shell":
        if (locale === undefined) {
          throw new RMachineResolveError(
            ERR_RESOLVE_FAILED,
            `Unable to resolve path for namespace "${namespace}" - locale is required for "shell" layout.`
          );
        }
        return `${namespace}/${locale}`;
      default:
        throw new RMachineResolveError(
          ERR_RESOLVE_FAILED,
          `Unable to resolve path for namespace "${namespace}" - no matching resource layout.`
        );
    }
  };
}

// #endregion
