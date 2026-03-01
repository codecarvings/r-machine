import { describe, expectTypeOf, it } from "vitest";
import type { AnyResourceAtlas } from "../../src/lib/index.js";
import type { CustomLocaleDetector, CustomLocaleStore, Strategy, SwitchableOption } from "../../src/strategy/index.js";

describe("strategy barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<Strategy<AnyResourceAtlas, unknown>>().toBeObject();
    expectTypeOf<Strategy<AnyResourceAtlas, unknown>>().toHaveProperty("rMachine");
    expectTypeOf<Strategy<AnyResourceAtlas, unknown>>().toHaveProperty("config");

    expectTypeOf<SwitchableOption>().toExtend<string>();

    expectTypeOf<CustomLocaleDetector>().toBeFunction();

    expectTypeOf<CustomLocaleStore>().toBeObject();
    expectTypeOf<CustomLocaleStore>().toHaveProperty("get");
    expectTypeOf<CustomLocaleStore>().toHaveProperty("set");
  });
});
