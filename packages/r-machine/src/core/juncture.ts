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

import { getterReadSlot, isGetterDef } from "./getter.js";
import type { AnyRes } from "./res.js";
import type { AnyResolvedNamespaceMap } from "./res-map.js";
import type { AnySurface } from "./surface.js";
import { setVertexGearTag, type VertexGearTagData } from "./vertex-gear.js";

export type Juncture = KernelJuncture | OuterJuncture;

export interface KernelJuncture {
  readonly kind: "kernel";
  readonly res: AnyRes;
  readonly surface: AnySurface;
}

export interface OuterJuncture {
  readonly kind: "outer";
  readonly res: AnyRes;
  readonly surfaceA: AnySurface;
  readonly surfaceB: AnySurface;
  current: AnySurface;
  version: number;
  readonly subscribers: Set<() => void>;
}

export function getCurrentSurface(juncture: Juncture): AnySurface {
  return juncture.kind === "outer" ? juncture.current : juncture.surface;
}

// TODO: brand-aware handling for Action (suspend+swap+notify) and Relay
// (excluded). Getter specs are already materialized as JS accessors below.
function buildSurface(res: AnyRes, vertexTag: VertexGearTagData | undefined): AnySurface {
  const surface = Object.create(null) as AnyResolvedNamespaceMap;
  for (const key of Object.keys(res)) {
    if (key.startsWith("$")) continue;
    const entry = (res as AnyResolvedNamespaceMap)[key];
    if (isGetterDef(entry)) {
      Object.defineProperty(surface, key, {
        enumerable: true,
        configurable: false,
        get: entry[getterReadSlot],
      });
    } else {
      Object.defineProperty(surface, key, {
        enumerable: true,
        configurable: false,
        writable: false,
        value: entry,
      });
    }
  }
  if (vertexTag !== undefined) {
    setVertexGearTag(surface as AnyRes, vertexTag);
  }
  return surface;
}

export function buildKernelJuncture(res: AnyRes, vertexTag: VertexGearTagData | undefined): KernelJuncture {
  return { kind: "kernel", res, surface: buildSurface(res, vertexTag) };
}

export function buildOuterJuncture(res: AnyRes, vertexTag: VertexGearTagData | undefined): OuterJuncture {
  const surfaceA = buildSurface(res, vertexTag);
  const surfaceB = buildSurface(res, vertexTag);
  return {
    kind: "outer",
    res,
    surfaceA,
    surfaceB,
    current: surfaceA,
    version: 0,
    subscribers: new Set<() => void>(),
  };
}
