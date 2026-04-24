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

import type { Kernel } from "./kernel.js";
import type { AnyRes } from "./res.js";

// Runtime-side untyped surface: the type-level `Surface<R, N, LET>` in surface.ts
// is heavily branded; at runtime we work with plain objects.
export type AnySurface = AnyRes;

export type Slot = StaticSlot | ReactiveSlot;

export interface StaticSlot {
  readonly kind: "static";
  readonly kernel: Kernel;
  readonly surface: AnySurface;
}

export interface ReactiveSlot {
  readonly kind: "reactive";
  readonly kernel: Kernel;
  readonly surfaceA: AnySurface;
  readonly surfaceB: AnySurface;
  current: AnySurface;
  version: number;
  readonly subscribers: Set<() => void>;
}

export function getCurrentSurface(slot: Slot): AnySurface {
  return slot.kind === "reactive" ? slot.current : slot.surface;
}

// TODO: brand-aware handling (Getter → accessor materialized, Action → wrapped
// with suspend+swap+notify, Relay → excluded) when the runtime composers for
// Getter/Action/Relay are implemented. Today brands are phantom types with no
// runtime marker, so this is a shallow pass-through clone that excludes $* keys.
function buildSurface(kernel: Kernel): AnySurface {
  const surface = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(kernel)) {
    if (key.startsWith("$")) continue;
    Object.defineProperty(surface, key, {
      enumerable: true,
      configurable: false,
      writable: false,
      value: (kernel as Record<string, unknown>)[key],
    });
  }
  return surface;
}

export function buildStaticSlot(kernel: Kernel): StaticSlot {
  return { kind: "static", kernel, surface: buildSurface(kernel) };
}

export function buildReactiveSlot(kernel: Kernel): ReactiveSlot {
  const surfaceA = buildSurface(kernel);
  const surfaceB = buildSurface(kernel);
  return {
    kind: "reactive",
    kernel,
    surfaceA,
    surfaceB,
    current: surfaceA,
    version: 0,
    subscribers: new Set<() => void>(),
  };
}
