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
  AnyRes,
  AnyResAtlas,
  ExtractNamespace,
  Getter,
  HandleMap,
  RelayBrand,
  RuntimeAction,
  ShellResolverHandle,
} from "r-machine/core";

type MockSurfaceItem<I> =
  I extends Getter<infer V> ? V : I extends Action<infer F> ? RuntimeAction<F> : I extends RelayBrand ? never : I;

type MockSurface<R extends AnyRes> = {
  [K in keyof R as K extends `$${string}` | symbol ? never : K]?: MockSurfaceItem<R[K]>;
};

// Mirrors the dep→surface conditional of `DepSurfaceMap`/`DepSurfaceList`: a
// normal dep is mocked with a partial surface, while a `res.perLocale(...)`
// dep — which RESOLVES to a locale loader `(locale) => Promise<Surface>` — is
// mocked with a FUNCTION returning a partial. The mock's partial is deep-merged
// over the REAL localized surface per call (see `applyDepOverride` in
// mock-merge.ts). Sync or async return accepted (the runtime awaits).
export type MockSurfaceMap<RA extends AnyResAtlas, HM extends HandleMap<RA>> = {
  [K in keyof HM]?: HM[K] extends ShellResolverHandle<infer S extends string, infer L>
    ? (locale: L) => MockSurface<RA["shape"][S]> | Promise<MockSurface<RA["shape"][S]>>
    : MockSurface<RA["shape"][ExtractNamespace<HM[K]>]>;
};
