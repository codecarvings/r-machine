import type { AnyResourceAtlas } from "r-machine";
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
} from "../../../src/core/index.js";
import { createReactBareToolset, createReactToolset } from "../../../src/core/index.js";

describe("core barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<ReactBareStrategy<AnyResourceAtlas>>().toBeObject();

    expectTypeOf(createReactBareToolset).toBeFunction();

    expectTypeOf<ReactBareRMachine>().toBeFunction();

    expectTypeOf<ReactBareToolset<AnyResourceAtlas>>().toBeObject();

    expectTypeOf<ReactStandardStrategyConfig>().toBeObject();

    expectTypeOf<PartialReactStandardStrategyConfig>().toBeObject();

    expectTypeOf<ReactStandardStrategyCore<AnyResourceAtlas>>().toBeObject();

    expectTypeOf<ReactStrategyCore<AnyResourceAtlas, unknown>>().toBeObject();

    expectTypeOf(createReactToolset).toBeFunction();

    expectTypeOf<ReactImpl>().toBeObject();
    expectTypeOf<ReactImpl>().toHaveProperty("readLocale");
    expectTypeOf<ReactImpl>().toHaveProperty("writeLocale");

    expectTypeOf<ReactToolset<AnyResourceAtlas>>().toBeObject();
  });
});
