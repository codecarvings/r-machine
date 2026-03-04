import { describe, expectTypeOf, it } from "vitest";
import { RMachineError } from "../../src/errors/r-machine-error.js";

describe("RMachineError", () => {
  it("should extend Error", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
  });

  it("should be constructable with code, message, and optional innerError", () => {
    expectTypeOf(RMachineError).constructorParameters.toEqualTypeOf<
      [code: string, message: string, innerError?: Error]
    >();
  });

  it("constructor should accept code and message", () => {
    const error = new RMachineError("ERR_TEST", "test");
    expectTypeOf(error).toEqualTypeOf<RMachineError>();
  });

  it("constructor should accept optional Error as third parameter", () => {
    const innerError = new Error("inner");
    const error = new RMachineError("ERR_TEST", "test", innerError);
    expectTypeOf(error).toEqualTypeOf<RMachineError>();
  });

  it("should have code property of type string", () => {
    expectTypeOf<RMachineError>().toHaveProperty("code").toEqualTypeOf<string>();
  });

  it("should have message property of type string", () => {
    expectTypeOf<RMachineError>().toHaveProperty("message").toEqualTypeOf<string>();
  });

  it("should have name property of type string", () => {
    expectTypeOf<RMachineError>().toHaveProperty("name").toEqualTypeOf<string>();
  });

  it("should have readonly innerError property", () => {
    expectTypeOf<RMachineError>().toHaveProperty("innerError").toEqualTypeOf<Error | undefined>();
  });

  it("should be assignable to Error", () => {
    const rmError: Error = new RMachineError("ERR_TEST", "test");
    expectTypeOf(rmError).toExtend<Error>();
  });

  it("innerError should accept RMachineError for error chaining", () => {
    const inner = new RMachineError("ERR_INNER", "inner");
    const outer = new RMachineError("ERR_OUTER", "outer", inner);
    expectTypeOf(outer.innerError).toEqualTypeOf<Error | undefined>();
  });
});
