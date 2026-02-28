import { describe, expectTypeOf, it } from "vitest";
import type { AnyResourceAtlas } from "../../../src/lib/index.js";
import type {
  CustomLocaleDetector,
  CustomLocaleStore,
  Strategy,
  SwitchableOption,
} from "../../../src/strategy/index.js";

describe("strategy barrel exports", () => {
  it("should export Strategy as an abstract class", () => {
    expectTypeOf<Strategy<AnyResourceAtlas, unknown>>().toBeObject();
    expectTypeOf<Strategy<AnyResourceAtlas, unknown>>().toHaveProperty("rMachine");
    expectTypeOf<Strategy<AnyResourceAtlas, unknown>>().toHaveProperty("config");
  });

  it("should export SwitchableOption as a string union", () => {
    expectTypeOf<SwitchableOption>().toExtend<string>();
  });

  it("should export CustomLocaleDetector as a function type", () => {
    expectTypeOf<CustomLocaleDetector>().toBeFunction();
  });

  it("should export CustomLocaleStore as an object type", () => {
    expectTypeOf<CustomLocaleStore>().toBeObject();
    expectTypeOf<CustomLocaleStore>().toHaveProperty("get");
    expectTypeOf<CustomLocaleStore>().toHaveProperty("set");
  });
});
