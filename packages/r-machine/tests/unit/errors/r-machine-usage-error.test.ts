import { describe, expect, it } from "vitest";
import { RMachineError } from "../../../src/errors/r-machine-error.js";
import { RMachineUsageError } from "../../../src/errors/r-machine-usage-error.js";

describe("RMachineUsageError", () => {
  it("should create an error with the correct message, name, and code", () => {
    const error = new RMachineUsageError("ERR_TEST", "Wrong usage.");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error).toBeInstanceOf(RMachineUsageError);
    expect(error.message).toBe("R-Machine Error [ERR_TEST]: Wrong usage.");
    expect(error.name).toBe("RMachineUsageError");
    expect(error.code).toBe("ERR_TEST");
  });

  it("should support error chaining with innerError", () => {
    const inner = new Error("Root cause.");
    const error = new RMachineUsageError("ERR_TEST", "Wrapper.", inner);

    expect(error.innerError).toBe(inner);
  });

  it("should default innerError to undefined", () => {
    const error = new RMachineUsageError("ERR_TEST", "No inner.");
    expect(error.innerError).toBeUndefined();
  });
});
