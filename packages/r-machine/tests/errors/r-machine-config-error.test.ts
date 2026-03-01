import { describe, expect, it } from "vitest";
import { RMachineConfigError } from "../../src/errors/r-machine-config-error.js";
import { RMachineError } from "../../src/errors/r-machine-error.js";

describe("RMachineConfigError", () => {
  it("should create an error with the correct message, name, and code", () => {
    const error = new RMachineConfigError("ERR_TEST", "Config is invalid.");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error).toBeInstanceOf(RMachineConfigError);
    expect(error.message).toBe("R-Machine Error [ERR_TEST]: Config is invalid.");
    expect(error.name).toBe("RMachineConfigError");
    expect(error.code).toBe("ERR_TEST");
  });

  it("should support error chaining with innerError", () => {
    const inner = new Error("Root cause.");
    const error = new RMachineConfigError("ERR_TEST", "Wrapper.", inner);

    expect(error.innerError).toBe(inner);
  });

  it("should default innerError to undefined", () => {
    const error = new RMachineConfigError("ERR_TEST", "No inner.");
    expect(error.innerError).toBeUndefined();
  });
});
