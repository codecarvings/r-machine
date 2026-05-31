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

import { deepPartialMerge } from "r-machine/core";

// ---------------------------------------------------------------------------
// Runtime override merge for mockPlug.
//
// The resolved `plugin` (Surface tree) returned by the production resolve is
// CACHED/SHARED by the connector, and each dep/kit Surface has
// `configurable: false` members (built by core's `buildSurface`). We therefore
// never mutate it: every override is layered onto FRESH objects, copying the
// originals' property DESCRIPTORS (which transplants getters WITHOUT invoking
// them — sidestepping the deferred-kit self-reference getters that throw while
// a factory is still running).
//
// Override semantics (Phase 1): deps (map by name / list by index) + `$.state`
// + `$.ports`. Each Surface member override is a whole-value replacement;
// `$.ports` is a deep-partial merge over the ports object; `$.state` seeds the
// resource's state cell (see `cloneCtx`). Kit + locale are Phase 2.
// ---------------------------------------------------------------------------

type AnyRecord = Record<string, unknown>;

interface StateCellLike {
  read(): unknown;
  peek(): unknown;
  publish(next: unknown): void;
}

function hasOwn(obj: object, key: PropertyKey): boolean {
  return Object.hasOwn(obj, key);
}

/**
 * True when `data` carries an override that requires post-processing the
 * resolved plugin. A `$.locale`-only override is a no-op here: it is already
 * applied by re-resolving the plug in the effective locale (see mock-plug.ts).
 */
export function hasOverrides(data: AnyRecord): boolean {
  for (const key of Object.keys(data)) {
    if (key !== "$") return true; // a dep (map) or positional (list) override
  }
  const ctx = data.$ as AnyRecord | undefined;
  if (ctx === undefined) return false;
  return ctx.ports !== undefined || ctx.state !== undefined || ctx.kit !== undefined;
}

/**
 * Locate the OuterGear state cell hanging off `$` under its private slot
 * symbol. The slot symbol is internal to the core composer and not part of the
 * public `r-machine/core` surface, so we detect the cell structurally instead
 * of importing the symbol. `$` carries at most one StateCell-shaped symbol.
 */
function findStateCell($: object): StateCellLike | undefined {
  for (const sym of Object.getOwnPropertySymbols($)) {
    const value = ($ as Record<symbol, unknown>)[sym];
    if (
      value !== null &&
      typeof value === "object" &&
      typeof (value as Partial<StateCellLike>).publish === "function" &&
      typeof (value as Partial<StateCellLike>).peek === "function" &&
      typeof (value as Partial<StateCellLike>).read === "function"
    ) {
      return value as StateCellLike;
    }
  }
  return undefined;
}

/**
 * Produce a fresh Surface with `partial` layered on top. Original members are
 * copied by descriptor (no getter is invoked); overridden members are defined
 * as fresh data properties. The clone is a new object, so the originals'
 * `configurable: false` descriptors never get in the way.
 */
export function cloneSurfaceWithOverride(surface: object, partial: AnyRecord | undefined): object {
  if (partial === undefined || Object.keys(partial).length === 0) return surface;
  const out = Object.create(Object.getPrototypeOf(surface));
  for (const key of Reflect.ownKeys(surface)) {
    if (typeof key === "string" && hasOwn(partial, key)) continue; // replaced below
    Object.defineProperty(out, key, Object.getOwnPropertyDescriptor(surface, key)!);
  }
  for (const key of Object.keys(partial)) {
    Object.defineProperty(out, key, {
      enumerable: true,
      configurable: true,
      writable: false,
      value: partial[key],
    });
  }
  return out;
}

/**
 * Clone the `$` context applying ctx-level overrides. `$.ports` is deep-merged
 * onto a fresh ports object (never mutating the shared `head.ports`). `$.state`
 * seeds the resource's state cell, which keeps every state reader consistent —
 * the `$.state` accessor, cursor identity getters (`cell.read()`) and action
 * reducers all observe the same seeded value. The cell is freshly created on
 * each resolve of the resource under test, so seeding it is local and safe.
 */
export function cloneCtx($: object, ctxOverride: AnyRecord | undefined): object {
  if (ctxOverride === undefined) return $;
  const overridePorts = ctxOverride.ports !== undefined;
  const overrideState = ctxOverride.state !== undefined;
  if (!overridePorts && !overrideState) return $;

  const out: AnyRecord = {};
  for (const key of Reflect.ownKeys($)) {
    Object.defineProperty(out, key, Object.getOwnPropertyDescriptor($, key)!);
  }

  if (overridePorts) {
    Object.defineProperty(out, "ports", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: deepPartialMerge(($ as AnyRecord).ports, ctxOverride.ports),
    });
  }

  if (overrideState) {
    const cell = findStateCell($);
    if (cell !== undefined) {
      // Seed the (fresh, own) cell; `$.state`, identity getters and actions
      // all read through it and stay consistent.
      cell.publish(deepPartialMerge(cell.peek(), ctxOverride.state));
    } else {
      // No state cell (resource declared no state): best-effort static value.
      Object.defineProperty(out, "state", {
        enumerable: true,
        configurable: true,
        writable: false,
        value: ctxOverride.state,
      });
    }
  }

  return out;
}

/** Clone a MAP plugin (`{ ...kit, ...deps, $ }`) applying dep + ctx overrides. */
export function cloneMapPlugin(plugin: object, data: AnyRecord): object {
  const ctxOverride = data.$ as AnyRecord | undefined;
  const out: AnyRecord = {};
  for (const key of Reflect.ownKeys(plugin)) {
    if (key === "$") continue; // rebuilt last
    if (typeof key === "string" && hasOwn(data, key)) {
      // Dep override. Deps are eager resolved Surfaces (data props), safe to read.
      out[key] = cloneSurfaceWithOverride((plugin as AnyRecord)[key] as object, data[key] as AnyRecord);
    } else {
      // Copy descriptor: keeps eager values and any lazy deferred-kit getter lazy.
      Object.defineProperty(out, key, Object.getOwnPropertyDescriptor(plugin, key)!);
    }
  }
  out.$ = cloneCtx((plugin as AnyRecord).$ as object, ctxOverride);
  return out;
}

/** Clone a LIST plugin (`[...deps, $]`) applying positional + ctx overrides. */
export function cloneListPlugin(plugin: readonly unknown[], data: AnyRecord): unknown[] {
  const ctxOverride = data.$ as AnyRecord | undefined;
  const lastIdx = plugin.length - 1;
  const out: unknown[] = [];
  for (let i = 0; i < lastIdx; i++) {
    const override = data[String(i)] as AnyRecord | undefined;
    out.push(override !== undefined ? cloneSurfaceWithOverride(plugin[i] as object, override) : plugin[i]);
  }
  out.push(cloneCtx(plugin[lastIdx] as object, ctxOverride));
  return out;
}
