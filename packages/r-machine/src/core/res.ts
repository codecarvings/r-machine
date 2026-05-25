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

import { ERR_ASYNC_DISPOSE_NOT_SUPPORTED, RMachineUsageError } from "#r-machine/errors";
import type { AnyResMatrix } from "./res-matrix.js";

export type AnyRes = Record<string, unknown> & object;

export type ResOriginType = "res-matrix" | "res";
export type AnyResOrigin = AnyResMatrix | AnyRes;

export function tryGetDispose(res: AnyRes): (() => void) | undefined {
  const asyncDispose = (res as { [Symbol.asyncDispose]?: unknown })[Symbol.asyncDispose];
  if (typeof asyncDispose !== "undefined") {
    throw new RMachineUsageError(
      ERR_ASYNC_DISPOSE_NOT_SUPPORTED,
      "Async dispose is not supported. Use [Symbol.dispose] instead of [Symbol.asyncDispose]."
    );
  }
  const dispose = (res as { [Symbol.dispose]?: unknown })[Symbol.dispose];
  return typeof dispose === "function" ? (dispose as () => void) : undefined;
}
