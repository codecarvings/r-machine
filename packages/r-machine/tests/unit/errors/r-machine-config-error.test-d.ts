import { describe, expectTypeOf, it } from "vitest";
import { RMachineConfigError } from "../../../src/errors/r-machine-config-error.js";
import type { RMachineError } from "../../../src/errors/r-machine-error.js";

describe("RMachineConfigError", () => {
  it("should extend RMachineError", () => {
    expectTypeOf<RMachineConfigError>().toExtend<RMachineError>();
  });

  it("should extend Error", () => {
    expectTypeOf<RMachineConfigError>().toExtend<Error>();
  });

  it("should be constructable with code, message, and optional innerError", () => {
    expectTypeOf(RMachineConfigError).constructorParameters.toEqualTypeOf<
      [code: string, message: string, innerError?: Error]
    >();
  });

  it("should have code property of type string", () => {
    expectTypeOf<RMachineConfigError>().toHaveProperty("code").toEqualTypeOf<string>();
  });

  it("should have readonly innerError property", () => {
    expectTypeOf<RMachineConfigError>().toHaveProperty("innerError").toEqualTypeOf<Error | undefined>();
  });
});
