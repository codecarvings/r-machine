/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyResOrigin, ResMatrix, RState } from "#r-machine/core";
import type { ExtractState } from "../core/plug.js";

type ExtractResource<RO extends AnyResOrigin> =
  RO extends ResMatrix<infer R, infer PB> ? R & RState<ExtractState<PB>> : RO;

declare const r: unique symbol;
interface R {
  [r]?: undefined;
}

export type BrandedResource<RO extends AnyResOrigin> = ExtractResource<RO> & R;
