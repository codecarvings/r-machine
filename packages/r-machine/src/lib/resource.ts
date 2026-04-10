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

import type { AnyResourceOrigin, ResourcePackage } from "#r-machine/core";

type Resource<O extends AnyResourceOrigin> = O extends ResourcePackage<infer R, any, any> ? R : O;

// Re-exported from setup.ts as RShape
declare const r: unique symbol;
export type BrandedResource<RF extends AnyResourceOrigin> = Resource<RF> & {
  readonly [r]?: undefined; // Allow nominal typing for resources
};
