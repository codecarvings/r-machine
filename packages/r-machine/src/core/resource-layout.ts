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

import type { AnyNamespace } from "./resource-atlas.js";

type ResourceLayoutType = "gear" | "shell" | "dynamic-shell";

export interface AnyResourceLayout {
  readonly [namespacePrefix: string]: ResourceLayoutType;
}

const NAMESPACE_SEPARATOR = "/";

type LayoutEntry = readonly [prefix: string, type: ResourceLayoutType];

export class ResourceLayoutManager {
  protected readonly entries: readonly LayoutEntry[];
  protected readonly cache = new Map<string, ResourceLayoutType | undefined>();

  constructor(layout: AnyResourceLayout) {
    this.entries = Object.entries(layout).sort(([a], [b]) => b.length - a.length);
  }

  resolve(namespace: AnyNamespace): ResourceLayoutType | undefined {
    const cached = this.cache.get(namespace);
    if (cached !== undefined || this.cache.has(namespace)) {
      return cached;
    }

    const match = this.entries.find(([prefix]) => isPrefixMatch(namespace, prefix));
    const type = match?.[1];
    this.cache.set(namespace, type);
    return type;
  }
}

function isPrefixMatch(namespace: string, prefix: string): boolean {
  if (namespace === prefix) return true;
  return (
    namespace.length > prefix.length && namespace.startsWith(prefix) && namespace[prefix.length] === NAMESPACE_SEPARATOR
  );
}
