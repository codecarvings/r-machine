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
import type { AnyNamespace, NamespaceParts } from "./res-domain.js";
import type { ResFamily } from "./res-plug.js";

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

export class ResLayoutResolver {
  constructor(layout: AnyResLayout) {
    this.entries = Object.entries(layout).sort(([a], [b]) => b.length - a.length);
  }
  protected readonly entries: readonly LayoutEntry[];
  protected resLayoutEntryTypeCache = new Map<string, ResLayoutEntryType>();
  protected namespacePartsCache = new Map<string, NamespaceParts>();

  protected resolveEntry(namespace: AnyNamespace): LayoutEntry {
    const entry = this.entries.find(([prefix]) => isPrefixMatch(namespace, prefix));
    if (entry === undefined) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Failed to resolve resource layout entry for namespace "${namespace}" - no matching layout entry found.`
      );
    }
    return entry;
  }

  resolveLayoutEntryType(namespace: AnyNamespace): ResLayoutEntryType {
    let type = this.resLayoutEntryTypeCache.get(namespace);
    if (type !== undefined) {
      return type;
    }

    type = this.resolveEntry(namespace)[1];
    if (!type) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Failed to resolve resource layout entry for namespace "${namespace}" - no matching layout entry found.`
      );
    }
    this.resLayoutEntryTypeCache.set(namespace, type);
    return type;
  }

  resolveNamespaceParts(namespace: AnyNamespace): NamespaceParts {
    const cached = this.namespacePartsCache.get(namespace);
    if (cached !== undefined) {
      return cached;
    }

    const entry = this.resolveEntry(namespace);
    const prefix = entry[0];
    const suffix = namespace.slice(prefix.length);
    const parts: NamespaceParts = [prefix, suffix];
    this.namespacePartsCache.set(namespace, parts);
    return parts;
  }

  resolvePath(namespace: AnyNamespace, locale: AnyLocale | undefined, layoutEntryType: ResLayoutEntryType): string {
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
}

function isPrefixMatch(namespace: string, prefix: string): boolean {
  if (namespace === prefix) {
    return true;
  }
  const base = prefix.slice(0, -1);
  if (namespace === base) {
    return true;
  }
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
//
// A leading `#` marks a namespace as internal (consumer-hidden) but does not
// change its layout classification — "#outer/temp" must resolve to the same
// layout type as "outer/temp". The marker is stripped before prefix matching.
export type ResolveLayoutType<RL extends AnyResLayout, N extends string> = ResolveLayoutTypeFromBase<
  RL,
  N extends `#${infer Rest}` ? Rest : N
>;

type ResolveLayoutTypeFromBase<RL extends AnyResLayout, N extends string> = {
  [P in keyof RL]: P extends string
    ? IsPrefixOf<P, N> extends true
      ? [HasMoreSpecificPrefix<RL, N, P>] extends [never]
        ? RL[P]
        : never
      : never
    : never;
}[keyof RL];
