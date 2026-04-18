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
import type { AnyNamespace } from "./res-domain.js";

// #region ResLayout

export type ResLayoutEntryType = "gear" | "vertex-gear" | "shell" | "dynamic-shell";

export interface AnyResLayout {
  readonly [namespacePrefix: string]: ResLayoutEntryType;
}

type LayoutEntry = readonly [prefix: string, type: ResLayoutEntryType];

export type ResLayoutEntryTypeResolver = (namespace: AnyNamespace) => ResLayoutEntryType | undefined;

export function createResLayoutEntryTypeResolver(layout: AnyResLayout): ResLayoutEntryTypeResolver {
  const entries: readonly LayoutEntry[] = Object.entries(layout).sort(([a], [b]) => b.length - a.length);
  const cache = new Map<string, ResLayoutEntryType | undefined>();

  return function resolveResLayoutType(namespace) {
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

// Type-level prefix match: N equals P, or N starts with "${P}/".
type IsPrefixOf<P extends string, N extends string> = N extends P ? true : N extends `${P}/${string}` ? true : false;

// For a given prefix P in LO that matches N, returns any other prefix in LO
// that is strictly more specific (extends P) and also matches N. Used to
// discard non-longest matches in ResolveLayoutType.
type HasMoreSpecificPrefix<LO extends AnyResLayout, N extends string, P extends string> = {
  [P2 in keyof LO]: P2 extends string
    ? P2 extends P
      ? never
      : P2 extends `${P}/${string}`
        ? IsPrefixOf<P2, N> extends true
          ? P2
          : never
        : never
    : never;
}[keyof LO];

// Longest-prefix layout-type resolution at the type level. Returns the entry
// type for the prefix P in LO with IsPrefixOf<P, N> and no more-specific
// matching prefix. Returns never when no prefix matches.
export type ResolveLayoutType<LO extends AnyResLayout, N extends string> = {
  [P in keyof LO]: P extends string
    ? IsPrefixOf<P, N> extends true
      ? [HasMoreSpecificPrefix<LO, N, P>] extends [never]
        ? LO[P]
        : never
      : never
    : never;
}[keyof LO];

// #endregion

// #region ResPathResolver

export type ResPathResolver = (namespace: AnyNamespace, locale: AnyLocale | undefined) => string;

export function createResPathResolver(resolveResLayoutType: ResLayoutEntryTypeResolver): ResPathResolver {
  return function resolveResPath(namespace, locale) {
    const layoutType = resolveResLayoutType(namespace);
    switch (layoutType) {
      case "gear":
      case "vertex-gear":
      case "dynamic-shell":
        return namespace;
      case "shell":
        if (locale === undefined) {
          throw new RMachineResolveError(
            ERR_RESOLVE_FAILED,
            `Unable to resolve resource path for namespace "${namespace}" - locale is required for "shell" layout.`
          );
        }
        return `${namespace}/${locale}`;
      default:
        throw new RMachineResolveError(
          ERR_RESOLVE_FAILED,
          `Unable to resolve resource path for namespace "${namespace}" - no matching resource layout.`
        );
    }
  };
}

// #endregion
