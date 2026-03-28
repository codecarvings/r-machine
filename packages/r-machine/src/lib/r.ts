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

import type { AnyRForge } from "./r-module.js";

export type AnyNamespace = string;

export type AnyR = any;

export interface AnyResourceAtlas {
  readonly [namespace: AnyNamespace]: AnyR;
}

export type Namespace<RA extends AnyResourceAtlas> = Extract<keyof RA, AnyNamespace>;

type RType<F extends AnyRForge> = F extends (...args: any[]) => infer R ? (R extends Promise<infer R2> ? R2 : R) : F;

// Branded type
declare const _rBrand: unique symbol;
interface RBrand {
  readonly [_rBrand]?: "R-Machine Resource";
}

export type R<F extends AnyRForge> = RType<F> & RBrand;
