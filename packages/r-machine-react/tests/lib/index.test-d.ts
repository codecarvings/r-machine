import type { AnyResourceAtlas } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { ReactStandardStrategy } from "../../src/lib/index.js";

describe("lib barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<ReactStandardStrategy<AnyResourceAtlas>>().toBeObject();
  });
});
