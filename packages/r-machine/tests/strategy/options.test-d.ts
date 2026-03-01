import { describe, expectTypeOf, it } from "vitest";
import type { CustomLocaleDetector, CustomLocaleStore, SwitchableOption } from "../../src/strategy/options.js";

describe("SwitchableOption", () => {
  it("should be a union of 'off' and 'on'", () => {
    expectTypeOf<SwitchableOption>().toEqualTypeOf<"off" | "on">();
  });

  it("'off' should be assignable to SwitchableOption", () => {
    expectTypeOf<"off">().toExtend<SwitchableOption>();
  });

  it("'on' should be assignable to SwitchableOption", () => {
    expectTypeOf<"on">().toExtend<SwitchableOption>();
  });

  it("invalid string should not be assignable to SwitchableOption", () => {
    expectTypeOf<"invalid">().not.toExtend<SwitchableOption>();
  });

  it("boolean should not be assignable to SwitchableOption", () => {
    expectTypeOf<boolean>().not.toExtend<SwitchableOption>();
  });
});

describe("CustomLocaleDetector", () => {
  it("should be a function type", () => {
    expectTypeOf<CustomLocaleDetector>().toBeFunction();
  });

  it("should accept no parameters", () => {
    expectTypeOf<CustomLocaleDetector>().parameters.toEqualTypeOf<[]>();
  });

  it("should return string or Promise<string>", () => {
    expectTypeOf<CustomLocaleDetector>().returns.toEqualTypeOf<string | Promise<string>>();
  });

  it("sync function returning string should be assignable", () => {
    const syncDetector = () => "en";
    expectTypeOf(syncDetector).toExtend<CustomLocaleDetector>();
  });

  it("async function returning string should be assignable", () => {
    const asyncDetector = async () => "en";
    expectTypeOf(asyncDetector).toExtend<CustomLocaleDetector>();
  });
});

describe("CustomLocaleStore", () => {
  it("should be an object type", () => {
    expectTypeOf<CustomLocaleStore>().toBeObject();
  });

  it("should have readonly get property", () => {
    expectTypeOf<CustomLocaleStore>().toHaveProperty("get");
  });

  it("should have readonly set property", () => {
    expectTypeOf<CustomLocaleStore>().toHaveProperty("set");
  });

  it("get should be a function with no parameters", () => {
    expectTypeOf<CustomLocaleStore["get"]>().parameters.toEqualTypeOf<[]>();
  });

  it("get should return string | undefined | Promise<string | undefined>", () => {
    expectTypeOf<CustomLocaleStore["get"]>().returns.toEqualTypeOf<string | undefined | Promise<string | undefined>>();
  });

  it("set should accept string parameter", () => {
    expectTypeOf<CustomLocaleStore["set"]>().parameter(0).toEqualTypeOf<string>();
  });

  it("set should return void or Promise<void>", () => {
    expectTypeOf<CustomLocaleStore["set"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });

  it("sync implementation should be assignable", () => {
    const syncStore: CustomLocaleStore = {
      get: () => "en",
      set: (_newLocale: string) => {},
    };
    expectTypeOf(syncStore).toExtend<CustomLocaleStore>();
  });

  it("async implementation should be assignable", () => {
    const asyncStore: CustomLocaleStore = {
      get: async () => "en",
      set: async (_newLocale: string) => {},
    };
    expectTypeOf(asyncStore).toExtend<CustomLocaleStore>();
  });

  it("get returning undefined should be valid", () => {
    const store: CustomLocaleStore = {
      get: () => undefined,
      set: (_newLocale: string) => {},
    };
    expectTypeOf(store).toExtend<CustomLocaleStore>();
  });
});
