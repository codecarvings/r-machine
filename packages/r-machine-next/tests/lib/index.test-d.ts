import { describe, expectTypeOf, it } from "vitest";
import { createPathAtlasDecl } from "../../src/lib/index.js";

describe("lib barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(createPathAtlasDecl).toBeFunction();
  });
});
