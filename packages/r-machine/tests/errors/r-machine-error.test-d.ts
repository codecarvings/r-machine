import { describe, expectTypeOf, it } from "vitest";
import { RMachineError } from "../../src/errors/r-machine-error.js";

describe("RMachineError", () => {
  it("extends Error", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
  });

  it("is constructable with (code, message, innerError?)", () => {
    expectTypeOf(RMachineError).constructorParameters.toEqualTypeOf<
      [code: string, message: string, innerError?: Error | undefined]
    >();
  });

  // The two properties RMachineError adds on top of Error — message/name are
  // inherited and not re-asserted here.
  it("exposes a string `code`", () => {
    expectTypeOf<RMachineError>().toHaveProperty("code").toEqualTypeOf<string>();
  });

  it("exposes an optional `innerError` of type Error", () => {
    expectTypeOf<RMachineError>().toHaveProperty("innerError").toEqualTypeOf<Error | undefined>();
  });
});
