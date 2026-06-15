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

import type {
  Action,
  AnyResAtlas,
  AnyResDomain,
  ExtractNamespace,
  Getter,
  HandleMap,
  RelayBrand,
  RuntimeAction,
} from "r-machine/core";

type MockSurfaceItem<I> =
  I extends Getter<infer V> ? V : I extends Action<infer F> ? RuntimeAction<F> : I extends RelayBrand ? never : I;

type MockSurface<RD extends AnyResDomain> = {
  [K in keyof RD as K extends `$${string}` | symbol ? never : K]?: MockSurfaceItem<RD[K]>;
};

export type MockSurfaceMap<RA extends AnyResAtlas, HM extends HandleMap<RA>> = {
  [K in keyof HM]?: MockSurface<RA["shape"][ExtractNamespace<HM[K]>]>;
};
