/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Action,
  AnyRes,
  AnyResAtlas,
  DeepPartial,
  ExtractNamespace,
  Getter,
  HandleMap,
  RelayBrand,
  RuntimeAction,
  ShellResolverHandle,
} from "r-machine/core";

// A mock member is a DeepPartial deep-merged over the real surface (see
// `mergeLiveOverride`): a getter's value and a plain data member both accept a
// partial sub-tree (siblings inherited from the real), degrading to a whole
// replacement on primitives. Actions replace wholesale; relays are wiring.
type MockSurfaceItem<I> =
  I extends Getter<infer V>
    ? DeepPartial<V>
    : I extends Action<infer F>
      ? RuntimeAction<F>
      : I extends RelayBrand
        ? never
        : DeepPartial<I>;

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
