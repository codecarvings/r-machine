import { describe, expectTypeOf, test } from "vitest";
import type { CustomLocaleDetector, CustomLocaleStore, SwitchableOption } from "../../../src/strategy/options.js";

describe("SwitchableOption", () => {
  test("should be a union of 'off' and 'on'", () => {
    expectTypeOf<SwitchableOption>().toEqualTypeOf<"off" | "on">();
  });

  test("'off' should be assignable to SwitchableOption", () => {
    expectTypeOf<"off">().toExtend<SwitchableOption>();
  });

  test("'on' should be assignable to SwitchableOption", () => {
    expectTypeOf<"on">().toExtend<SwitchableOption>();
  });

  test("invalid string should not be assignable to SwitchableOption", () => {
    expectTypeOf<"invalid">().not.toExtend<SwitchableOption>();
  });

  test("boolean should not be assignable to SwitchableOption", () => {
    expectTypeOf<boolean>().not.toExtend<SwitchableOption>();
  });
});

describe("CustomLocaleDetector", () => {
  test("should be a function type", () => {
    expectTypeOf<CustomLocaleDetector>().toBeFunction();
  });

  test("should accept no parameters", () => {
    expectTypeOf<CustomLocaleDetector>().parameters.toEqualTypeOf<[]>();
  });

  test("should return string or Promise<string>", () => {
    expectTypeOf<CustomLocaleDetector>().returns.toEqualTypeOf<string | Promise<string>>();
  });

  test("sync function returning string should be assignable", () => {
    const syncDetector = () => "en";
    expectTypeOf(syncDetector).toExtend<CustomLocaleDetector>();
  });

  test("async function returning string should be assignable", () => {
    const asyncDetector = async () => "en";
    expectTypeOf(asyncDetector).toExtend<CustomLocaleDetector>();
  });
});

describe("CustomLocaleStore", () => {
  test("should be an object type", () => {
    expectTypeOf<CustomLocaleStore>().toBeObject();
  });

  test("should have readonly get property", () => {
    expectTypeOf<CustomLocaleStore>().toHaveProperty("get");
  });

  test("should have readonly set property", () => {
    expectTypeOf<CustomLocaleStore>().toHaveProperty("set");
  });

  test("get should be a function with no parameters", () => {
    expectTypeOf<CustomLocaleStore["get"]>().parameters.toEqualTypeOf<[]>();
  });

  test("get should return string | undefined | Promise<string | undefined>", () => {
    expectTypeOf<CustomLocaleStore["get"]>().returns.toEqualTypeOf<string | undefined | Promise<string | undefined>>();
  });

  test("set should accept string parameter", () => {
    expectTypeOf<CustomLocaleStore["set"]>().parameter(0).toEqualTypeOf<string>();
  });

  test("set should return void or Promise<void>", () => {
    expectTypeOf<CustomLocaleStore["set"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });

  test("sync implementation should be assignable", () => {
    const syncStore: CustomLocaleStore = {
      get: () => "en",
      set: (_newLocale: string) => {},
    };
    expectTypeOf(syncStore).toExtend<CustomLocaleStore>();
  });

  test("async implementation should be assignable", () => {
    const asyncStore: CustomLocaleStore = {
      get: async () => "en",
      set: async (_newLocale: string) => {},
    };
    expectTypeOf(asyncStore).toExtend<CustomLocaleStore>();
  });

  test("get returning undefined should be valid", () => {
    const store: CustomLocaleStore = {
      get: () => undefined,
      set: (_newLocale: string) => {},
    };
    expectTypeOf(store).toExtend<CustomLocaleStore>();
  });
});
