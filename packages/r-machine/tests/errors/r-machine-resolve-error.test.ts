import { describe, expect, it } from "vitest";
import { RMachineError } from "../../src/errors/r-machine-error.js";
import { RMachineResolveError } from "../../src/errors/r-machine-resolve-error.js";

describe("RMachineResolveError", () => {
  it("should create an error with the correct message, name, and code", () => {
    const error = new RMachineResolveError("ERR_TEST", "Resolution failed.");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error).toBeInstanceOf(RMachineResolveError);
    expect(error.message).toBe("R-Machine Error [ERR_TEST]: Resolution failed.");
    expect(error.name).toBe("RMachineResolveError");
    expect(error.code).toBe("ERR_TEST");
  });

  it("should support error chaining with innerError", () => {
    const inner = new Error("Root cause.");
    const error = new RMachineResolveError("ERR_TEST", "Wrapper.", inner);

    expect(error.innerError).toBe(inner);
  });

  it("should default innerError to undefined", () => {
    const error = new RMachineResolveError("ERR_TEST", "No inner.");
    expect(error.innerError).toBeUndefined();
  });
});
