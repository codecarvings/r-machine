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

import type { AnyResource, AnyResourceOrigin, ResourceFamily } from "./resource.js";
import type { AnyResourcePlug } from "./resource-plug.js";

export interface ResMatrixDescriptor {
  readonly family: ResourceFamily;
  readonly isReactive: boolean;
  readonly isVertex: boolean;
}

const resMatrixDescriptor: unique symbol = Symbol("resMatrixDescriptor");
export interface ResMatrix<R extends AnyResource, P extends AnyResourcePlug> {
  readonly [resMatrixDescriptor]: ResMatrixDescriptor;
  readonly factory: () => Promise<R>;
  readonly plug: P;
}
export type AnyResMatrix = ResMatrix<AnyResource, AnyResourcePlug>;

export function createResMatrix<R extends AnyResource, P extends AnyResourcePlug>(
  descriptor: ResMatrixDescriptor,
  factory: () => Promise<R>,
  plug: P
): ResMatrix<R, P> {
  return {
    [resMatrixDescriptor]: descriptor,
    factory,
    plug,
  };
}

export function tryGetResMatrixDescriptor(origin: AnyResourceOrigin): ResMatrixDescriptor | undefined {
  return (origin as Partial<AnyResMatrix>)[resMatrixDescriptor];
}
