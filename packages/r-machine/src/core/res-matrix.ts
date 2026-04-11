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

import type { AnyRes, AnyResOrigin, ResFamily } from "./res.js";
import type { AnyResPlug } from "./res-plug.js";

export interface ResMatrixData {
  readonly family: ResFamily;
  readonly isReactive: boolean;
  readonly isVertex: boolean;
}

const resMatrixData: unique symbol = Symbol("resMatrixData");
export interface ResMatrix<R extends AnyRes, P extends AnyResPlug> {
  readonly [resMatrixData]: ResMatrixData;
  readonly factory: () => Promise<R>;
  readonly plug: P;
}
export type AnyResMatrix = ResMatrix<AnyRes, AnyResPlug>;

export function createResMatrix<R extends AnyRes, P extends AnyResPlug>(
  data: ResMatrixData,
  factory: () => Promise<R>,
  plug: P
): ResMatrix<R, P> {
  return {
    [resMatrixData]: data,
    factory,
    plug,
  };
}

export function tryGetResMatrixData(origin: AnyResOrigin): ResMatrixData | undefined {
  return (origin as Partial<AnyResMatrix>)[resMatrixData];
}
