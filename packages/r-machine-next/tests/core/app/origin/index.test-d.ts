import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyNextAppOriginStrategyConfig,
  LocaleOriginMap,
  NextAppOriginStrategyConfigParams,
  NextAppOriginStrategyCore,
  NextAppOriginStrategyUrlTranslator,
} from "../../../../src/core/app/origin/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core/app/origin barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<NextAppOriginStrategyCore<any, any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppOriginStrategyUrlTranslator>().toBeObject();

    expectTypeOf<LocaleOriginMap>().toBeObject();

    expectTypeOf<AnyNextAppOriginStrategyConfig>().toBeObject();

    expectTypeOf<NextAppOriginStrategyConfigParams<any, any, any, any, any>>().toBeObject();
  });
});
