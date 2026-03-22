import { describe, expectTypeOf, it } from "vitest";
import { PathAtlasSeed } from "../../src/lib/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("lib barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(PathAtlasSeed.create).toBeFunction();
  });
});
