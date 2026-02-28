import type { AnyResourceAtlas } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { NextAppFlatStrategy, NextAppOriginStrategy, NextAppPathStrategy } from "../../../src/app/index.js";

describe("app barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<NextAppFlatStrategy<AnyResourceAtlas>>().toBeObject();

    expectTypeOf<NextAppOriginStrategy<AnyResourceAtlas>>().toBeObject();

    expectTypeOf<NextAppPathStrategy<AnyResourceAtlas>>().toBeObject();
  });
});
