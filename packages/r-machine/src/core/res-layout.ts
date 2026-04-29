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
import type { GearRole } from "./gear-plug.js";
import type { AnyNamespace } from "./res-domain.js";
import type { ResFamily } from "./res-plug.js";

// #region ResLayout

export type ResLayoutEntryType =
  | "gear:inner"
  | "gear:base"
  | "gear:outer"
  | "gear:outer(vertex)"
  | "shell"
  | "shell(mono)";

export function getResFamilyFromLayoutType(layoutType: ResLayoutEntryType): ResFamily {
  switch (layoutType) {
    case "gear:inner":
    case "gear:base":
    case "gear:outer":
    case "gear:outer(vertex)":
      return "gear";
    case "shell":
    case "shell(mono)":
      return "shell";
  }
}

export function getGearRoleFromLayoutType(layoutType: ResLayoutEntryType): GearRole | undefined {
  switch (layoutType) {
    case "gear:inner":
      return "inner";
    case "gear:base":
      return "base";
    case "gear:outer":
    case "gear:outer(vertex)":
      return "outer";
    default:
      return undefined;
  }
}

export function isOuterGearLayoutType(layoutType: ResLayoutEntryType): boolean {
  return layoutType === "gear:outer" || layoutType === "gear:outer(vertex)";
}

export function isVertexGearLayoutType(layoutType: ResLayoutEntryType): boolean {
  return layoutType === "gear:outer(vertex)";
}

export interface AnyResLayout {
  readonly [namespacePrefix: `${string}/`]: ResLayoutEntryType;
}

type LayoutEntry = readonly [prefix: string, type: ResLayoutEntryType];

export type ResLayoutEntryTypeResolver = (namespace: AnyNamespace) => ResLayoutEntryType;

export function createResLayoutEntryTypeResolver(layout: AnyResLayout): ResLayoutEntryTypeResolver {
  const entries: readonly LayoutEntry[] = Object.entries(layout).sort(([a], [b]) => b.length - a.length);
  const cache = new Map<string, ResLayoutEntryType>();

  return function resolveResLayoutType(namespace) {
    let type = cache.get(namespace);
    if (type !== undefined) {
      return type;
    }

    type = entries.find(([prefix]) => isPrefixMatch(namespace, prefix))?.[1];
    if (!type) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Failed to resolve resource layout entry for namespace "${namespace}" - no matching layout entry found.`
      );
    }

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

export type ResPathResolver = (
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  layoutEntryType: ResLayoutEntryType
) => string;

export function resolveResPath(
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  layoutEntryType: ResLayoutEntryType
): string {
  switch (layoutEntryType) {
    case "gear:inner":
    case "gear:base":
    case "gear:outer":
    case "gear:outer(vertex)":
    case "shell(mono)":
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
}

// #endregion
