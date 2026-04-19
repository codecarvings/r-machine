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

import type { Action } from "./action.js";
import type { Getter } from "./getter.js";
import type { RelayBrand } from "./relay.js";
import type { AnyNamespace, AnyResDomain, Namespace } from "./res-domain.js";

type SurfaceItem<I> = I extends Getter<infer V> ? V : I extends Action<infer F> ? F : I extends RelayBrand ? never : I;

declare const surfaceNamespaceSymbol: unique symbol;

export type Surface<R extends AnyResDomain, N extends AnyNamespace> = {
  readonly [surfaceNamespaceSymbol]: N;
} & {
  readonly [K in keyof R as K extends `$${string}` ? never : K]: SurfaceItem<R[K]>;
};

export type AnySurfaceOf<RD extends AnyResDomain> = {
  [N in Namespace<RD>]: Surface<RD[N], N>;
}[Namespace<RD>];
