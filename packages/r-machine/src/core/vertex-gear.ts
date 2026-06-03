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

import type { AnyRes } from "./res.js";
import type { AnyNamespace } from "./res-domain.js";

export interface VertexGearTagData {
  readonly namespace: AnyNamespace;
  readonly genId: number;
  // String discriminator that distinguishes one occurrence of a vertex
  // namespace from another within the same wire's deps. For list-mode plugs
  // it's the position index (`String(index)`); for map-mode plugs it's the
  // map key. Every vertex slot has one — single-dep plugs use `"0"` (list)
  // or the lone key (map). See [[project-vertex-per-consumer-instance]].
  readonly occurrenceTag: string;
}

const vertexGearTagSymbol = Symbol("vertexGearTag");
interface VertexGear {
  readonly [vertexGearTagSymbol]: VertexGearTagData;
}

export function tryGetVertexGearTag(res: AnyRes): VertexGearTagData | undefined {
  return (res as Partial<VertexGear>)[vertexGearTagSymbol];
}

export function setVertexGearTag(res: AnyRes, tag: VertexGearTagData): void {
  (res as any)[vertexGearTagSymbol] = tag;
}

// Composite opaque key that identifies a vertex slot within a wire's lifetime.
// Format: `${genId}\x1f${occurrenceTag}`. Used as:
//   - the value side of `VertexGearMap` (so VertexFrame can propagate identity
//     to descendants without exposing internal fields);
//   - the discriminator inside the RM vertex slot cache key
//     (`V:${ns}\x1f${vertexKey}`).
// Internal indexing (e.g. `vertexSlotsByGenId`) keeps using the numeric
// `genId` separately — the composite is purely for cache/transport.
export function buildVertexKey(genId: number, occurrenceTag: string): string {
  return `${genId}\x1f${occurrenceTag}`;
}

export type VertexGearMap = Record<AnyNamespace, string>;
