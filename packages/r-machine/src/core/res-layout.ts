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
import type { ResFamily } from "./res.js";
import type { AnyNamespace } from "./res-domain.js";

// #region ResLayout

export type ResLayoutEntryType = "gear" | "gear:vertex" | "shell" | "shell:mono";

export function getResFamilyFromLayoutType(layoutType: ResLayoutEntryType): ResFamily {
  switch (layoutType) {
    case "gear":
    case "gear:vertex":
      return "gear";
    case "shell":
    case "shell:mono":
      return "shell";
  }
}

export interface AnyResLayout {
  readonly [namespacePrefix: `${string}/`]: ResLayoutEntryType;
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
  const base = prefix.slice(0, -1);
  if (namespace === base) return true;
  return namespace.startsWith(prefix);
}

// Type-level prefix match. Invariant: P ends with "/".
// N matches when it equals P's base (P without trailing "/") or starts with P.
type IsPrefixOf<P extends string, N extends string> = P extends `${infer Base}/`
  ? N extends Base
    ? true
    : N extends `${P}${string}`
      ? true
      : false
  : false;

// For a given prefix P in RL that matches N, returns any other prefix in RL
// that is strictly more specific (extends P) and also matches N. Used to
// discard non-longest matches in ResolveLayoutType.
type HasMoreSpecificPrefix<RL extends AnyResLayout, N extends string, P extends string> = {
  [P2 in keyof RL]: P2 extends string
    ? P2 extends P
      ? never
      : P2 extends `${P}${string}`
        ? IsPrefixOf<P2, N> extends true
          ? P2
          : never
        : never
    : never;
}[keyof RL];

// Longest-prefix layout-type resolution at the type level. Returns the entry
// type for the prefix P in RL with IsPrefixOf<P, N> and no more-specific
// matching prefix. Returns never when no prefix matches.
export type ResolveLayoutType<RL extends AnyResLayout, N extends string> = {
  [P in keyof RL]: P extends string
    ? IsPrefixOf<P, N> extends true
      ? [HasMoreSpecificPrefix<RL, N, P>] extends [never]
        ? RL[P]
        : never
      : never
    : never;
}[keyof RL];

// #endregion

// #region ResPathResolver

export type ResPathResolver = (namespace: AnyNamespace, locale: AnyLocale | undefined) => string;

export function createResPathResolver(resolveResLayoutType: ResLayoutEntryTypeResolver): ResPathResolver {
  return function resolveResPath(namespace, locale) {
    const layoutType = resolveResLayoutType(namespace);
    switch (layoutType) {
      case "gear":
      case "gear:vertex":
      case "shell:mono":
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
