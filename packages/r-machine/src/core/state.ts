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

import type { AnyResAtlas, ResAtlas } from "./res-atlas.js";
import type { StateCell } from "./state-cell.js";

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

// State brand. A stateful OuterGear resource carries its state type `S` on this
// phantom symbol, stamped by `BrandedResource` (lib/branded-resource.ts) via
// `ExtractState`. The symbol is declared HERE, in core, so the brander (lib) and
// the reader (`ExtractRState`, used by `StatefulOuterStateMap` below) share a
// single `unique symbol` identity — a second declaration in lib would be a
// distinct type and `ExtractRState` would never match.
//
// `StatefulOuterStateMap` is deliberately a standalone helper, NOT a precomputed
// `ResAtlas` member: a mapped-over-`RD` conditional on the atlas is paid on every
// consumer `Plug()` completion (the hot IntelliSense path — it tanked the
// type-scale benchmark ~5×). As a helper the cost lands only where used (the
// `mockPlug` testing layer).
declare const stateBrand: unique symbol;
export interface RState<S> {
  readonly [stateBrand]?: S;
}
type ExtractRState<T> = T extends RState<infer S> ? S : never;

export type StatefulOuterStateMap<RA extends AnyResAtlas> =
  RA extends ResAtlas<any, infer RD>
    ? {
        readonly [K in keyof RD as K extends string
          ? [ExtractRState<RD[K]>] extends [undefined]
            ? never
            : K
          : never]: ExtractRState<RD[K]>;
      }
    : never;

// Internal back-reference from a stateful OuterGear's `res` (and the surface
// built from it) to its live `StateCell`. Stamped during composing and copied
// onto the surface by `buildSurface` (res-pod.ts) — exactly like the vertex
// gear tag. The testing layer (`mockPlug` controller) reads it to drive/read a
// resource's state reactively; production code never reads it, so it stays an
// invisible internal detail. A vertex gear carries its per-instance cell here,
// so a consumer's controller binds to the specific instance it received.
const stateAccessSymbol = Symbol("stateAccess");
interface StateAccess {
  readonly [stateAccessSymbol]: StateCell<unknown>;
}

export function tryGetStateAccess(target: object): StateCell<unknown> | undefined {
  return (target as Partial<StateAccess>)[stateAccessSymbol];
}

export function setStateAccess(target: object, cell: StateCell<unknown>): void {
  (target as { [stateAccessSymbol]: StateCell<unknown> })[stateAccessSymbol] = cell;
}
