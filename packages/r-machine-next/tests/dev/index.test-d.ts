import { describe, expectTypeOf, it } from "vitest";
import { createNextDevImport } from "../../src/dev/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("dev barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(createNextDevImport).toBeFunction();
  });
});
