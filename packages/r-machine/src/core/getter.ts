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

import type { AnyState } from "./outer-gear.js";

declare const getterBrand: unique symbol;
export interface GetterBrand {
  readonly [getterBrand]: true;
}
export type Getter<V> = V & GetterBrand;

export interface StatelessGetterComposer {
  <V>(getter: () => V): Getter<V>;
  <V>(memoized: "memoized", getter: () => V): Getter<V>;
}

export interface GetterComposer<S extends AnyState> extends StatelessGetterComposer {
  (): Getter<S>;
}

export type DefaultGetter<S extends AnyState> = Getter<S>;

// Runtime marker carried on the spec object returned by the composer. The surface
// materializer (juncture.ts:buildSurface) detects this slot and installs the kit
// entry as a JS accessor (Object.defineProperty get) instead of a plain value, so
// consumers read state with property syntax (`surface.value`) and the cassette
// recorder sees the underlying cell read on every access.
export const getterReadSlot: unique symbol = Symbol("r-machine.getterRead");
export interface GetterDef {
  readonly [getterReadSlot]: () => unknown;
}
export function isGetterDef(v: unknown): v is GetterDef {
  return typeof v === "object" && v !== null && getterReadSlot in v;
}

export function createGetterDef(read: () => unknown): GetterDef {
  return { [getterReadSlot]: read };
}
