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

import type { AnyRes } from "#r-machine/core";
import type { AnyResOrigin, ResFamily } from "./res.js";
import type { AnyResPlug } from "./res-plug.js";

export interface ResMatrixMeta {
  readonly family: ResFamily;
  readonly isReactive: boolean;
  readonly isVertex: boolean;
}

const resMatrixMetaSymbol: unique symbol = Symbol("resMatrixMeta");
// Cannot use ResMatrix<R extends AnyRes, ...> because of res tags
export interface ResMatrix<R, P extends AnyResPlug> {
  readonly [resMatrixMetaSymbol]: ResMatrixMeta;
  readonly factory: () => Promise<R>;
  readonly plug: P;
}

export type AnyResMatrix = ResMatrix<any, any>;

export function createResMatrix<R extends AnyRes, P extends AnyResPlug>(
  meta: ResMatrixMeta,
  factory: () => Promise<R>,
  plug: P
): ResMatrix<R, P> {
  return {
    [resMatrixMetaSymbol]: meta,
    factory,
    plug,
  };
}

export function tryGetResMatrixMeta(origin: AnyResOrigin): ResMatrixMeta | undefined {
  return (origin as Partial<AnyResMatrix>)[resMatrixMetaSymbol];
}
