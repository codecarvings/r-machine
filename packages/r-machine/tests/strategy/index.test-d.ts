import { describe, expectTypeOf, it } from "vitest";
import type { CustomLocaleDetector, CustomLocaleStore, StrategyHelpers } from "../../src/strategy/index.js";
import { Strategy } from "../../src/strategy/index.js";

// Barrel test: a single it() verifying export completeness only. Detailed shape
// tests live in the dedicated per-symbol *.test-d.ts files.
describe("strategy barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(Strategy).toBeObject();
    expectTypeOf<StrategyHelpers<string>>().toHaveProperty("localeHelper");
    expectTypeOf<CustomLocaleDetector>().toBeFunction();
    expectTypeOf<CustomLocaleStore>().toBeObject();
  });
});
