/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ERR_RESOLVE_FAILED, RMachineResolveError } from "#r-machine/errors";
import type { AnyResOrigin } from "./res.js";

export interface AnyResModule {
  readonly r: AnyResOrigin;
}

export function validateResModule(input: unknown): RMachineResolveError | null {
  if (typeof input !== "object" || input === null) {
    return new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Invalid resource module - expected an object, got ${input === null ? "null" : typeof input}.`
    );
  }
  if (!("r" in input)) {
    return new RMachineResolveError(ERR_RESOLVE_FAILED, `Invalid resource module - missing required property "r".`);
  }
  const r = (input as { r: unknown }).r;
  if (typeof r !== "object" || r === null) {
    return new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Invalid resource module - property "r" is not a valid resource origin (expected a non-null object, got ${r === null ? "null" : typeof r}).`
    );
  }
  return null;
}
