import { describe, expect, it } from "vitest";
import { RMachineError } from "../../src/errors/r-machine-error.js";

export function describeErrorSubclass(
  name: string,
  ErrorClass: new (code: string, message: string, innerError?: Error) => RMachineError,
  parentClasses: (new (...args: any[]) => Error)[] = []
) {
  describe(name, () => {
    it("should create an error with the correct message, name, and code", () => {
      const error = new ErrorClass("ERR_TEST", "Test message.");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RMachineError);
      for (const Parent of parentClasses) {
        expect(error).toBeInstanceOf(Parent);
      }
      expect(error).toBeInstanceOf(ErrorClass);
      expect(error.message).toBe("R-Machine Error [ERR_TEST]: Test message.");
      expect(error.name).toBe(name);
      expect(error.code).toBe("ERR_TEST");
    });

    it("should support error chaining with innerError", () => {
      const inner = new Error("Root cause.");
      const error = new ErrorClass("ERR_TEST", "Wrapper.", inner);

      expect(error.innerError).toBe(inner);
    });

    it("should default innerError to undefined", () => {
      const error = new ErrorClass("ERR_TEST", "No inner.");
      expect(error.innerError).toBeUndefined();
    });
  });
}
