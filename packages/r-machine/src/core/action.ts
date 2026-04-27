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

type BuiltinAtomic =
  | Date
  | RegExp
  | Map<unknown, unknown>
  | Set<unknown>
  | ((...args: any[]) => any)
  | Promise<unknown>
  | Error
  | URL
  | URLSearchParams
  | ArrayBuffer
  | ArrayBufferView;

declare const atomicBrand: unique symbol;
export type Atomic = { readonly [atomicBrand]?: undefined };

type IsAtomic<T> = T extends BuiltinAtomic ? true : T extends Atomic ? true : false;

type DeepPartial<T> =
  IsAtomic<T> extends true
    ? T
    : T extends (infer I)[]
      ? DeepPartial<I>[]
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

declare const actionBrand: unique symbol;
export interface ActionBrand {
  readonly [actionBrand]: true;
}
export type Action<F extends (...args: any[]) => any> = F & ActionBrand;

export interface ActionComposer<S extends AnyState> {
  (): Action<(partialState: DeepPartial<S>) => S>;
  <A extends unknown[]>(reducer: (...args: A) => DeepPartial<S>): Action<(...args: A) => S>;
}

export type DefaultAction<S extends AnyState> = Action<(partialState: DeepPartial<S>) => S>;
