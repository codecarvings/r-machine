/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Action, AnyAction } from "./action.js";

const cmdBrand: unique symbol = Symbol("cmd");

export interface Cmd {
  readonly [cmdBrand]: true;
  // readonly target: string | [string, number];
  // readonly action: string;
  readonly action: AnyAction;
  readonly payload: unknown[];
}

export function isCmd(v: unknown): v is Cmd {
  return typeof v === "object" && v !== null && cmdBrand in v;
}

export function createCmd(action: AnyAction, payload: unknown[]): Cmd {
  return Object.defineProperty({ action, payload }, cmdBrand, { value: true }) as Cmd;
}

export type CmdComposer = <F extends (...args: any[]) => any>(action: Action<F>, ...args: Parameters<F>) => Cmd;
