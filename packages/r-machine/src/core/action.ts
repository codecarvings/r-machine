/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DeepPartial } from "./deep-partial.js";
import { setMemberName } from "./member-name.js";
import type { AnyState } from "./state.js";

const actionBrand: unique symbol = Symbol("action");
export interface ActionBrand {
  readonly [actionBrand]: true;
}
export type Action<F extends (...args: any[]) => any> = F & ActionBrand;
export type RuntimeAction<F extends (...args: any[]) => any> = (...args: Parameters<F>) => void;

export type AnyAction = Action<(...args: any[]) => any>;

export function isAction(v: unknown): v is AnyAction {
  return typeof v === "function" && actionBrand in v;
}

export function createAction<F extends (...args: any[]) => any>(fn: F, name: string): Action<F> {
  Object.defineProperty(fn, actionBrand, { value: true });
  setMemberName(fn, name);
  return fn as Action<F>;
}

export interface ActionComposer<S extends AnyState> {
  (): Action<(partialState: DeepPartial<S>) => S>;
  <A extends unknown[]>(reducer: (...args: A) => DeepPartial<S>): Action<(...args: A) => S>;
}

export type DefaultAction<S extends AnyState> = Action<(partialState: DeepPartial<S>) => S>;
