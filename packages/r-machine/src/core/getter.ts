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

import { setMemberName } from "./member-name.js";
import type { AnyState } from "./outer-gear.js";

const getterBrand: unique symbol = Symbol("getter");
export interface GetterBrand {
  readonly [getterBrand]: true;
}
export type Getter<V> = (() => V) & GetterBrand;

export type AnyGetter = Getter<unknown>;

export function isGetter(v: unknown): v is AnyGetter {
  return typeof v === "function" && getterBrand in v;
}

export function createGetter<V>(read: () => V, name: string): Getter<V> {
  Object.defineProperty(read, getterBrand, { value: true });
  setMemberName(read, name);
  return read as Getter<V>;
}

export interface StatelessGetterComposer {
  <V>(getter: () => V): Getter<V>;
  <V>(memoized: "memoized", getter: () => V): Getter<V>;
}

export interface GetterComposer<S extends AnyState> extends StatelessGetterComposer {
  (): Getter<S>;
}

export type DefaultGetter<S extends AnyState> = Getter<S>;
