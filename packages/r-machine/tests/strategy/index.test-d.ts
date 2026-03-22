import { describe, expectTypeOf, it } from "vitest";
import type { CustomLocaleDetector, CustomLocaleStore, SwitchableOption } from "../../src/strategy/index.js";
import { Strategy } from "../../src/strategy/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("strategy barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(Strategy).toBeObject();

    expectTypeOf<SwitchableOption>().toExtend<string>();

    expectTypeOf<CustomLocaleDetector>().toBeFunction();

    expectTypeOf<CustomLocaleStore>().toBeObject();
  });
});
