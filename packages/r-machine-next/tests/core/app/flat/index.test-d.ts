import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyNextAppFlatStrategyConfig,
  NextAppFlatStrategyConfig,
  NextAppFlatStrategyConfigParams,
  NextAppFlatStrategyCore,
} from "../../../../src/core/app/flat/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core/app/flat barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<NextAppFlatStrategyCore<any, any, any, any, any>>().toBeObject();

    expectTypeOf<AnyNextAppFlatStrategyConfig>().toBeObject();

    expectTypeOf<NextAppFlatStrategyConfig<any, any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppFlatStrategyConfigParams<any, any, any, any, any>>().toBeObject();
  });
});
