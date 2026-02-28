import { describe, expectTypeOf, it } from "vitest";
import { createPathAtlasDecl } from "../../../src/lib/index.js";

describe("lib barrel exports", () => {
  it("should export createPathAtlasDecl as a function", () => {
    expectTypeOf(createPathAtlasDecl).toBeFunction();
  });
});
