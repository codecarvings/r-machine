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

import type { AnyResOrigin, ResMatrix, RState } from "#r-machine/core";
import type { ExtractState } from "../core/plug.js";

type ExtractResource<RO extends AnyResOrigin> =
  RO extends ResMatrix<infer R, infer PB> ? R & RState<ExtractState<PB>> : RO;

declare const r: unique symbol;
interface R {
  [r]?: undefined;
}

export type BrandedResource<RO extends AnyResOrigin> = ExtractResource<RO> & R;
