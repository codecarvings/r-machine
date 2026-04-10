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
import type { ResourceFamily } from "./resource.js";
import type { AnyNamespace } from "./resource-atlas.js";

// #region ResourceLayout

export type ResourceLayoutType = ResourceFamily | "dynamic-shell";

export interface AnyResourceLayout {
  readonly [namespacePrefix: string]: ResourceLayoutType;
}

type LayoutEntry = readonly [prefix: string, type: ResourceLayoutType];

export type ResourceLayoutResolver = (namespace: AnyNamespace) => ResourceLayoutType | undefined;

export function createResourceLayoutResolver(layout: AnyResourceLayout): ResourceLayoutResolver {
  const entries: readonly LayoutEntry[] = Object.entries(layout).sort(([a], [b]) => b.length - a.length);
  const cache = new Map<string, ResourceLayoutType | undefined>();

  return function resolveResourceLayout(namespace) {
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

export function createPathResolver(resolveResourceLayout: ResourceLayoutResolver): PathResolver {
  return function resolvePath(namespace, locale) {
    const layoutType = resolveResourceLayout(namespace);
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
