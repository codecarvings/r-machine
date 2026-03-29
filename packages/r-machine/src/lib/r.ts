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

import type { AnyLocale } from "#r-machine/locale";
import type { RCtx } from "./r-ctx.js";
import type { NamespaceMap, RMap } from "./r-map.js";
import type { AnyRForge } from "./r-module.js";
import type { AnyResourceAtlas } from "./resource-atlas.js";

export type AnyR = any;

type RType<F extends AnyRForge> = F extends (...args: any[]) => infer R ? (R extends Promise<infer R2> ? R2 : R) : F;

// Branded type
declare const _rBrand: unique symbol;
interface RBrand {
  readonly [_rBrand]?: "R-Machine Resource";
}

export type RShape<F extends AnyRForge> = RType<F> & RBrand;

export interface R<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  define<T>(factory: ($: RCtx<L, RMap<RA, KA>>) => T): T;
}
