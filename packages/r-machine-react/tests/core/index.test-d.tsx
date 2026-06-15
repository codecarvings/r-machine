import type { AnyResAtlas, ExperimentalFlags } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import {
  type AnyReactStandardStrategyConfig,
  createReactBareToolset,
  type ReactPlugKitMap,
  type ReactStandardStrategyConfig,
  type ReactStandardStrategyConfigParams,
  ReactStandardStrategyCore,
  type ReactToolset,
  RequestScopeContext,
  type VertexFrameType,
} from "../../src/core/index.js";
import { createReactBareToolset as originalCreateReactBareToolset } from "../../src/core/react-bare-toolset.js";
import type { ReactPlugKitMap as OriginalReactPlugKitMap } from "../../src/core/react-plug.js";
import type {
  AnyReactStandardStrategyConfig as OriginalAnyStandardConfig,
  ReactStandardStrategyConfig as OriginalConfig,
  ReactStandardStrategyConfigParams as OriginalConfigParams,
} from "../../src/core/react-standard-strategy-core.js";
import { ReactStandardStrategyCore as OriginalStandardStrategyCoreValue } from "../../src/core/react-standard-strategy-core.js";
import type { ReactToolset as OriginalReactToolset } from "../../src/core/react-toolset.js";
import { RequestScopeContext as OriginalRequestScopeContext } from "../../src/core/scope-context.js";
import type { VertexFrame as OriginalVertexFrame } from "../../src/core/vertex-frame.js";

// Concrete, consistent instantiation for the generic type re-exports: barrel
// and original resolve to the same declaration, so any uniform arg set proves
// identity.
type RA = AnyResAtlas;
type L = AnyLocale;
type EF = ExperimentalFlags;
type KM = {};

describe("core barrel exports", () => {
  it("re-exports value exports (functions / classes / context) identical to originals", () => {
    expectTypeOf(createReactBareToolset).toEqualTypeOf(originalCreateReactBareToolset);
    expectTypeOf(ReactStandardStrategyCore).toEqualTypeOf(OriginalStandardStrategyCoreValue);
    expectTypeOf(RequestScopeContext).toEqualTypeOf(OriginalRequestScopeContext);
  });

  it("re-exports the strategy config types (incl. the Params + Any aliases)", () => {
    expectTypeOf<ReactStandardStrategyConfig<RA, KM>>().toEqualTypeOf<OriginalConfig<RA, KM>>();
    expectTypeOf<ReactStandardStrategyConfigParams<RA, KM>>().toEqualTypeOf<OriginalConfigParams<RA, KM>>();
    expectTypeOf<AnyReactStandardStrategyConfig>().toEqualTypeOf<OriginalAnyStandardConfig>();
  });

  it("re-exports createReactToolset surface types (ReactToolset)", () => {
    expectTypeOf<ReactToolset<RA, L, EF, KM>>().toEqualTypeOf<OriginalReactToolset<RA, L, EF, KM>>();
  });

  it("re-exports the plug/vertex helper types", () => {
    expectTypeOf<ReactPlugKitMap<RA>>().toEqualTypeOf<OriginalReactPlugKitMap<RA>>();
    expectTypeOf<VertexFrameType>().toEqualTypeOf<typeof OriginalVertexFrame>();
  });
});
