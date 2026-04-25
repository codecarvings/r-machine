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

export type VertexGearMap = Record<AnyNamespace, number>;
