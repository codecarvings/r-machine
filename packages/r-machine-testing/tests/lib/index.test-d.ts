import { describe, expectTypeOf, it } from "vitest";
import { createEventCollector, mockPlug, resetMockPlugs, verifyResourceAtlas } from "../../src/lib/index.js";

// Barrel test: a single it() verifying export completeness only. Behavioural
// type contracts live with each primitive's runtime tests.
describe("@r-machine/testing lib barrel exports", () => {
  it("exports all expected runtime symbols", () => {
    expectTypeOf(mockPlug).toBeFunction();
    expectTypeOf(resetMockPlugs).toBeFunction();
    expectTypeOf(verifyResourceAtlas).toBeFunction();
    expectTypeOf(createEventCollector).toBeFunction();
  });
});
