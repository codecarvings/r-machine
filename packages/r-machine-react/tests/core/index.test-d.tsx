import type { AnyLocale, AnyResourceAtlas } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type {
  PartialReactStandardStrategyConfig,
  ReactBareRMachine,
  ReactBareStrategy,
  ReactBareToolset,
  ReactImpl,
  ReactStandardStrategyConfig,
  ReactStandardStrategyCore,
  ReactStrategyCore,
  ReactToolset,
} from "../../src/core/index.js";
import { createReactBareToolset, createReactToolset } from "../../src/core/index.js";
import type { ReactBareStrategy as OriginalReactBareStrategy } from "../../src/core/react-bare-strategy.js";
import type {
  ReactBareRMachine as OriginalReactBareRMachine,
  ReactBareToolset as OriginalReactBareToolset,
} from "../../src/core/react-bare-toolset.js";
import { createReactBareToolset as originalCreateReactBareToolset } from "../../src/core/react-bare-toolset.js";
import type {
  ReactStandardStrategyConfig as OriginalConfig,
  PartialReactStandardStrategyConfig as OriginalPartialConfig,
  ReactStandardStrategyCore as OriginalStandardStrategyCore,
} from "../../src/core/react-standard-strategy-core.js";
import type { ReactStrategyCore as OriginalReactStrategyCore } from "../../src/core/react-strategy-core.js";
import type {
  ReactImpl as OriginalReactImpl,
  ReactToolset as OriginalReactToolset,
} from "../../src/core/react-toolset.js";
import { createReactToolset as originalCreateReactToolset } from "../../src/core/react-toolset.js";

describe("core barrel exports", () => {
  it("re-exports ReactBareStrategy identical to the original", () => {
    expectTypeOf<ReactBareStrategy<AnyResourceAtlas, AnyLocale>>().toEqualTypeOf<
      OriginalReactBareStrategy<AnyResourceAtlas, AnyLocale>
    >();
  });

  it("re-exports createReactBareToolset identical to the original", () => {
    expectTypeOf(createReactBareToolset).toEqualTypeOf(originalCreateReactBareToolset);
  });

  it("re-exports ReactBareRMachine identical to the original", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toEqualTypeOf<OriginalReactBareRMachine<AnyLocale>>();
  });

  it("re-exports ReactBareToolset identical to the original", () => {
    expectTypeOf<ReactBareToolset<AnyResourceAtlas, AnyLocale>>().toEqualTypeOf<
      OriginalReactBareToolset<AnyResourceAtlas, AnyLocale>
    >();
  });

  it("re-exports ReactStandardStrategyConfig identical to the original", () => {
    expectTypeOf<ReactStandardStrategyConfig>().toEqualTypeOf<OriginalConfig>();
  });

  it("re-exports PartialReactStandardStrategyConfig identical to the original", () => {
    expectTypeOf<PartialReactStandardStrategyConfig>().toEqualTypeOf<OriginalPartialConfig>();
  });

  it("re-exports ReactStandardStrategyCore identical to the original", () => {
    expectTypeOf<ReactStandardStrategyCore<AnyResourceAtlas, AnyLocale>>().toEqualTypeOf<
      OriginalStandardStrategyCore<AnyResourceAtlas, AnyLocale>
    >();
  });

  it("re-exports ReactStrategyCore identical to the original", () => {
    expectTypeOf<ReactStrategyCore<AnyResourceAtlas, AnyLocale, unknown>>().toEqualTypeOf<
      OriginalReactStrategyCore<AnyResourceAtlas, AnyLocale, unknown>
    >();
  });

  it("re-exports createReactToolset identical to the original", () => {
    expectTypeOf(createReactToolset).toEqualTypeOf(originalCreateReactToolset);
  });

  it("re-exports ReactImpl identical to the original", () => {
    expectTypeOf<ReactImpl<AnyLocale>>().toEqualTypeOf<OriginalReactImpl<AnyLocale>>();
  });

  it("re-exports ReactToolset identical to the original", () => {
    expectTypeOf<ReactToolset<AnyResourceAtlas, AnyLocale>>().toEqualTypeOf<
      OriginalReactToolset<AnyResourceAtlas, AnyLocale>
    >();
  });
});
