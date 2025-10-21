import { describe, expect, test } from "vitest";
import { RMachineError } from "./r-machine-error.js";

describe("RMachineError", () => {
  test("should create an error with the correct message", () => {
    const error = new RMachineError("Something went wrong.");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error.message).toBe("R-Machine Error: Something went wrong.");
    expect(error.name).toBe("RMachineError");
  });

  test("should create an error without an inner error", () => {
    const error = new RMachineError("Test error.");

    expect(error.innerError).toBeUndefined();
  });

  test("should create an error with an inner error", () => {
    const innerError = new Error("Inner error message.");
    const error = new RMachineError("Outer error message.", innerError);

    expect(error.innerError).toBe(innerError);
    expect(error.innerError?.message).toBe("Inner error message.");
    expect(error.message).toBe("R-Machine Error: Outer error message.");
  });

  test("should preserve the error stack trace", () => {
    const error = new RMachineError("Stack trace test.");

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("RMachineError");
  });

  test("should be catchable as a generic Error", () => {
    try {
      throw new RMachineError("Catchable error.");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RMachineError);
      if (error instanceof RMachineError) {
        expect(error.message).toBe("R-Machine Error: Catchable error.");
      }
    }
  });

  test("should allow chaining of errors", () => {
    const rootError = new Error("Root cause.");
    const middleError = new RMachineError("Middle layer error.", rootError);
    const topError = new RMachineError("Top layer error.", middleError);

    expect(topError.innerError).toBe(middleError);
    expect((topError.innerError as RMachineError).innerError).toBe(rootError);
  });
});
