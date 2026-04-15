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

import type { AnyNamespace } from "./res-atlas.js";

export interface VertexGearTag {
  readonly namespace: AnyNamespace;
  readonly genId: number;
}
const vertexGearTagSymbol = Symbol("vertexGearTag");
export interface VertexGearRes {
  readonly [vertexGearTagSymbol]: VertexGearTag;
}

export function getVertexGearTag(res: VertexGearRes): VertexGearTag {
  return res[vertexGearTagSymbol];
}

export type VertexGearMap = Record<AnyNamespace, number>;
