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
