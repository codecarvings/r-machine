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

import type { DeepPartial } from "./deep-partial.js";
import { setMemberName } from "./member-name.js";
import type { AnyState } from "./outer-gear.js";

const actionBrand: unique symbol = Symbol("action");
export interface ActionBrand {
  readonly [actionBrand]: true;
}
export type Action<F extends (...args: any[]) => any> = F & ActionBrand;

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
