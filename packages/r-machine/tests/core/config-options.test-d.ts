import { describe, expectTypeOf, it } from "vitest";
import type { SwitchableOption } from "../../src/core/config-options.js";

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
