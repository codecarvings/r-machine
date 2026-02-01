import { describe, expectTypeOf, test } from "vitest";
import { RMachineError } from "./r-machine-error.js";

describe("RMachineError", () => {
  test("should extend Error", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
  });

  test("should be constructable with message only", () => {
    expectTypeOf(RMachineError).constructorParameters.toEqualTypeOf<[message: string, innerError?: Error]>();
  });

  test("constructor should accept string as first parameter", () => {
    const error = new RMachineError("test");
    expectTypeOf(error).toEqualTypeOf<RMachineError>();
  });

  test("constructor should accept optional Error as second parameter", () => {
    const innerError = new Error("inner");
    const error = new RMachineError("test", innerError);
    expectTypeOf(error).toEqualTypeOf<RMachineError>();
  });

  test("should have message property of type string", () => {
    expectTypeOf<RMachineError>().toHaveProperty("message").toEqualTypeOf<string>();
  });

  test("should have name property of type string", () => {
    expectTypeOf<RMachineError>().toHaveProperty("name").toEqualTypeOf<string>();
  });

  test("should have readonly innerError property", () => {
    expectTypeOf<RMachineError>().toHaveProperty("innerError").toEqualTypeOf<Error | undefined>();
  });

  test("should be assignable to Error", () => {
    const rmError: Error = new RMachineError("test");
    expectTypeOf(rmError).toExtend<Error>();
  });

  test("innerError should accept RMachineError for error chaining", () => {
    const inner = new RMachineError("inner");
    const outer = new RMachineError("outer", inner);
    expectTypeOf(outer.innerError).toEqualTypeOf<Error | undefined>();
  });
});
