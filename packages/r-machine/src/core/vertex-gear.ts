/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
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
