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

// Cannot use typing because symbol will appear in the intellisense of the resource

export interface VertexGearTag {
  readonly namespace: AnyNamespace;
  readonly genId: number;
}
export const vertexGearTagSymbol = Symbol("vertexGearTag");

export type VertexGearMap = Record<AnyNamespace, number>;
