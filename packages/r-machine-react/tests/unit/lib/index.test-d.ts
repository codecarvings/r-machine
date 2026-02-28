import type { AnyResourceAtlas } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { ReactStandardStrategy } from "../../../src/lib/index.js";

describe("lib barrel exports", () => {
  it("should export ReactStandardStrategy as a class", () => {
    expectTypeOf<ReactStandardStrategy<AnyResourceAtlas>>().toBeObject();
  });
});
