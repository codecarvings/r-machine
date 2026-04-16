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

import type { Action, AnyResAtlas, ExtractNamespace, Getter, NamespaceMap, RelayBrand } from "r-machine/core";

type MockableSurfaceItem<I> =
  I extends Getter<infer V> ? () => V : I extends Action<infer F> ? F : I extends RelayBrand ? never : I;

type MockableSurface<R extends AnyResAtlas> = {
  readonly [K in keyof R as K extends `$${string}` ? never : K]: MockableSurfaceItem<R[K]>;
};

export type MockableSurfaceMap<RA extends AnyResAtlas, NM extends NamespaceMap<RA>> = {
  readonly [K in keyof NM]?: Partial<MockableSurface<RA[ExtractNamespace<NM[K]>]>>;
};
