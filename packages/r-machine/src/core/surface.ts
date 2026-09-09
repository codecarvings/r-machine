/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Action, RuntimeAction } from "./action.js";
import type { Getter } from "./getter.js";
import type { RelayBrand } from "./relay.js";
import type { AnyRes } from "./res.js";
import type { AnyNamespace } from "./res-domain.js";
import type { ResLayoutEntryType } from "./res-layout.js";

type SurfaceItem<I> =
  I extends Getter<infer V> ? V : I extends Action<infer F> ? RuntimeAction<F> : I extends RelayBrand ? never : I;

declare const surfaceNamespaceSymbol: unique symbol;
declare const surfaceLayoutEntryTypeSymbol: unique symbol;
export type Surface<R extends AnyRes, N extends AnyNamespace, LET extends ResLayoutEntryType> = {
  readonly [surfaceNamespaceSymbol]: N;
  readonly [surfaceLayoutEntryTypeSymbol]: LET;
} & SurfaceBody<R>;

type SurfaceBody<R> = {
  readonly [K in keyof R as K extends `$${string}` | symbol ? never : K]: SurfaceItem<R[K]>;
};

// export type AnyClientVertexGearSurface = Surface<AnyRes, AnyNamespace, "gear:outer(vertex)">;
export type AnyClientGearSurface = Surface<AnyRes, AnyNamespace, "gear:outer(vertex)" | "gear:outer" | "gear:base">;

// Runtime-side untyped surface
export type AnySurface = AnyRes;
