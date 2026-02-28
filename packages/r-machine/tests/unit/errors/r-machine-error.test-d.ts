import { describe, expectTypeOf, it } from "vitest";
import { RMachineError } from "../../../src/errors/r-machine-error.js";

describe("RMachineError", () => {
  it("should extend Error", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
  });

  it("should be constructable with message only", () => {
    expectTypeOf(RMachineError).constructorParameters.toEqualTypeOf<[message: string, innerError?: Error]>();
  });

  it("constructor should accept string as first parameter", () => {
    const error = new RMachineError("test");
    expectTypeOf(error).toEqualTypeOf<RMachineError>();
  });

  it("constructor should accept optional Error as second parameter", () => {
    const innerError = new Error("inner");
    const error = new RMachineError("test", innerError);
    expectTypeOf(error).toEqualTypeOf<RMachineError>();
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
    const rmError: Error = new RMachineError("test");
    expectTypeOf(rmError).toExtend<Error>();
  });

  it("innerError should accept RMachineError for error chaining", () => {
    const inner = new RMachineError("inner");
    const outer = new RMachineError("outer", inner);
    expectTypeOf(outer.innerError).toEqualTypeOf<Error | undefined>();
  });
});
