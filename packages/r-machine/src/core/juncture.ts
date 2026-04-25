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
import type { AnySurface } from "./surface.js";
import { setVertexGearTag, type VertexGearTagData } from "./vertex-gear.js";

export type Juncture = StaticJuncture | ReactiveJuncture;

export interface StaticJuncture {
  readonly kind: "static";
  readonly res: AnyRes;
  readonly surface: AnySurface;
}

export interface ReactiveJuncture {
  readonly kind: "reactive";
  readonly res: AnyRes;
  readonly surfaceA: AnySurface;
  readonly surfaceB: AnySurface;
  current: AnySurface;
  version: number;
  readonly subscribers: Set<() => void>;
}

export function getCurrentSurface(juncture: Juncture): AnySurface {
  return juncture.kind === "reactive" ? juncture.current : juncture.surface;
}

// TODO: brand-aware handling (Getter → accessor materialized, Action → wrapped
// with suspend+swap+notify, Relay → excluded) when the runtime composers for
// Getter/Action/Relay are implemented. Today brands are phantom types with no
// runtime marker, so this is a shallow pass-through clone that excludes $* keys.
function buildSurface(res: AnyRes, vertexTag: VertexGearTagData | undefined): AnySurface {
  const surface = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(res)) {
    if (key.startsWith("$")) continue;
    Object.defineProperty(surface, key, {
      enumerable: true,
      configurable: false,
      writable: false,
      value: (res as Record<string, unknown>)[key],
    });
  }
  if (vertexTag !== undefined) {
    setVertexGearTag(surface as AnyRes, vertexTag);
  }
  return surface;
}

export function buildStaticJuncture(res: AnyRes, vertexTag: VertexGearTagData | undefined): StaticJuncture {
  return { kind: "static", res, surface: buildSurface(res, vertexTag) };
}

export function buildReactiveJuncture(res: AnyRes, vertexTag: VertexGearTagData | undefined): ReactiveJuncture {
  const surfaceA = buildSurface(res, vertexTag);
  const surfaceB = buildSurface(res, vertexTag);
  return {
    kind: "reactive",
    res,
    surfaceA,
    surfaceB,
    current: surfaceA,
    version: 0,
    subscribers: new Set<() => void>(),
  };
}
