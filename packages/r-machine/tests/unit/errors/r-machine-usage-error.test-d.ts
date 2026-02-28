import { describe, expectTypeOf, it } from "vitest";
import type { RMachineError } from "../../../src/errors/r-machine-error.js";
import { RMachineUsageError } from "../../../src/errors/r-machine-usage-error.js";

describe("RMachineUsageError", () => {
  it("should extend RMachineError", () => {
    expectTypeOf<RMachineUsageError>().toExtend<RMachineError>();
  });

  it("should extend Error", () => {
    expectTypeOf<RMachineUsageError>().toExtend<Error>();
  });

  it("should be constructable with code, message, and optional innerError", () => {
    expectTypeOf(RMachineUsageError).constructorParameters.toEqualTypeOf<
      [code: string, message: string, innerError?: Error]
    >();
  });

  it("should have code property of type string", () => {
    expectTypeOf<RMachineUsageError>().toHaveProperty("code").toEqualTypeOf<string>();
  });

  it("should have readonly innerError property", () => {
    expectTypeOf<RMachineUsageError>().toHaveProperty("innerError").toEqualTypeOf<Error | undefined>();
  });
});
