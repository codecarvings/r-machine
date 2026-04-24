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

export type Kernel = StaticKernel | ReactiveKernel;

export interface StaticKernel {
  readonly kind: "static";
  readonly res: AnyRes;
  readonly surface: AnySurface;
}

export interface ReactiveKernel {
  readonly kind: "reactive";
  readonly res: AnyRes;
  readonly surfaceA: AnySurface;
  readonly surfaceB: AnySurface;
  current: AnySurface;
  version: number;
  readonly subscribers: Set<() => void>;
}

export function getCurrentSurface(kernel: Kernel): AnySurface {
  return kernel.kind === "reactive" ? kernel.current : kernel.surface;
}

// TODO: brand-aware handling (Getter → accessor materialized, Action → wrapped
// with suspend+swap+notify, Relay → excluded) when the runtime composers for
// Getter/Action/Relay are implemented. Today brands are phantom types with no
// runtime marker, so this is a shallow pass-through clone that excludes $* keys.
function buildSurface(res: AnyRes): AnySurface {
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
  return surface;
}

export function buildStaticKernel(res: AnyRes): StaticKernel {
  return { kind: "static", res, surface: buildSurface(res) };
}

export function buildReactiveKernel(res: AnyRes): ReactiveKernel {
  const surfaceA = buildSurface(res);
  const surfaceB = buildSurface(res);
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
