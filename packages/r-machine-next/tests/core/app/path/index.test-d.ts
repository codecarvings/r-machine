import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyNextAppPathStrategyConfig,
  NextAppPathStrategyConfig,
  NextAppPathStrategyConfigParams,
  NextAppPathStrategyCore,
} from "../../../../src/core/app/path/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core/app/path barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<NextAppPathStrategyCore<any, any, any, any, any>>().toBeObject();

    expectTypeOf<AnyNextAppPathStrategyConfig>().toBeObject();

    expectTypeOf<NextAppPathStrategyConfig<any, any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppPathStrategyConfigParams<any, any, any, any, any>>().toBeObject();
  });
});
