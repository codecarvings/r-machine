import { describe, expectTypeOf, it } from "vitest";
import type { AnyResourceAtlas, RMachine } from "../../src/lib/index.js";
import type { CustomLocaleDetector, CustomLocaleStore, Strategy, SwitchableOption } from "../../src/strategy/index.js";

type AnyStrategy = Strategy<AnyResourceAtlas, string, unknown>;

describe("strategy barrel exports", () => {
  it("exports Strategy as an object type with rMachine and config properties", () => {
    expectTypeOf<AnyStrategy>().toBeObject();
    expectTypeOf<AnyStrategy>().toHaveProperty("rMachine");
    expectTypeOf<AnyStrategy>().toHaveProperty("config");
  });

  it("Strategy should propagate locale type to rMachine", () => {
    type NarrowStrategy = Strategy<AnyResourceAtlas, "en" | "it", unknown>;
    expectTypeOf<NarrowStrategy["rMachine"]>().toEqualTypeOf<RMachine<AnyResourceAtlas, "en" | "it">>();
  });

  it("SwitchableOption should be the union 'off' | 'on'", () => {
    expectTypeOf<SwitchableOption>().toEqualTypeOf<"off" | "on">();
  });

  it("CustomLocaleDetector should return string or Promise<string>", () => {
    expectTypeOf<CustomLocaleDetector>().toEqualTypeOf<() => string | Promise<string>>();
  });

  it("CustomLocaleStore should have typed get and set methods", () => {
    expectTypeOf<CustomLocaleStore>().toBeObject();
    expectTypeOf<CustomLocaleStore["get"]>().toEqualTypeOf<() => string | undefined | Promise<string | undefined>>();
    expectTypeOf<CustomLocaleStore["set"]>().toEqualTypeOf<(newLocale: string) => void | Promise<void>>();
  });
});
