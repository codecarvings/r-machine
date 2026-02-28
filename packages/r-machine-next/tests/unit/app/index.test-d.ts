import type { AnyResourceAtlas } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { NextAppFlatStrategy, NextAppOriginStrategy, NextAppPathStrategy } from "../../../src/app/index.js";

describe("app barrel exports", () => {
  it("should export NextAppFlatStrategy as a class", () => {
    expectTypeOf<NextAppFlatStrategy<AnyResourceAtlas>>().toBeObject();
  });

  it("should export NextAppOriginStrategy as a class", () => {
    expectTypeOf<NextAppOriginStrategy<AnyResourceAtlas>>().toBeObject();
  });

  it("should export NextAppPathStrategy as a class", () => {
    expectTypeOf<NextAppPathStrategy<AnyResourceAtlas>>().toBeObject();
  });
});
