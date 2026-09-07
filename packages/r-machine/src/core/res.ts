/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
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
