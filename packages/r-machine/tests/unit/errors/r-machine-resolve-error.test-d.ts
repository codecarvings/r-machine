import { describe, expectTypeOf, it } from "vitest";
import type { RMachineError } from "../../../src/errors/r-machine-error.js";
import { RMachineResolveError } from "../../../src/errors/r-machine-resolve-error.js";

describe("RMachineResolveError", () => {
  it("should extend RMachineError", () => {
    expectTypeOf<RMachineResolveError>().toExtend<RMachineError>();
  });

  it("should extend Error", () => {
    expectTypeOf<RMachineResolveError>().toExtend<Error>();
  });

  it("should be constructable with code, message, and optional innerError", () => {
    expectTypeOf(RMachineResolveError).constructorParameters.toEqualTypeOf<
      [code: string, message: string, innerError?: Error]
    >();
  });

  it("should have code property of type string", () => {
    expectTypeOf<RMachineResolveError>().toHaveProperty("code").toEqualTypeOf<string>();
  });

  it("should have readonly innerError property", () => {
    expectTypeOf<RMachineResolveError>().toHaveProperty("innerError").toEqualTypeOf<Error | undefined>();
  });
});
