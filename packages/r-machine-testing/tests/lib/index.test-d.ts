import type { AnyListPlugHead, AnyMapPlugHead } from "r-machine/core";
import { describe, expectTypeOf, it } from "vitest";
import type {
  EventCollector,
  MockListController,
  MockMapController,
  VerifyIssue,
  VerifyReport,
  VerifyResourceAtlasOptions,
} from "../../src/lib/index.js";
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

  it("exports the expected type aliases", () => {
    // EventCollector: the read-only buffer returned by createEventCollector.
    expectTypeOf<EventCollector>().toHaveProperty("events");

    // Mock controllers carry the MockController base (reset + dispose).
    expectTypeOf<MockMapController<AnyMapPlugHead>>().toHaveProperty("reset");
    expectTypeOf<MockListController<AnyListPlugHead>>().toHaveProperty("reset");

    // verifyResourceAtlas report/issue/options shapes.
    expectTypeOf<VerifyReport>().toHaveProperty("issues");
    expectTypeOf<VerifyIssue>().toHaveProperty("kind");
    expectTypeOf<VerifyResourceAtlasOptions>().toExtend<{ tsconfig?: string }>();
    expectTypeOf<VerifyResourceAtlasOptions>().toExtend<{ loaders?: (string | URL)[] }>();
  });
});
