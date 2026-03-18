import type { AnyResourceAtlas } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { NextAppFlatStrategy, NextAppOriginStrategy, NextAppPathStrategy } from "../../src/app/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("app barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<NextAppFlatStrategy<AnyResourceAtlas, AnyLocale>>().toBeObject();

    expectTypeOf<NextAppOriginStrategy<AnyResourceAtlas, AnyLocale>>().toBeObject();

    expectTypeOf<NextAppPathStrategy<AnyResourceAtlas, AnyLocale>>().toBeObject();
  });
});
