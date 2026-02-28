import { describe, expect, it } from "vitest";
import { RMachineError } from "../../../src/errors/r-machine-error.js";

describe("RMachineError", () => {
  it("should create an error with the correct message and name", () => {
    const error = new RMachineError("Something went wrong.");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error.message).toBe("R-Machine Error: Something went wrong.");
    expect(error.name).toBe("RMachineError");
  });

  it("should default innerError to undefined", () => {
    const error = new RMachineError("Test error.");
    expect(error.innerError).toBeUndefined();
  });

  it("should store innerError and support chaining", () => {
    const root = new Error("Root cause.");
    const middle = new RMachineError("Middle layer.", root);
    const top = new RMachineError("Top layer.", middle);

    expect(middle.innerError).toBe(root);
    expect(top.innerError).toBe(middle);
    expect((top.innerError as RMachineError).innerError).toBe(root);
  });

  it("should preserve special characters in the message", () => {
    const msg = `quote "here" and newline\nand tab\t`;
    const error = new RMachineError(msg);
    expect(error.message).toBe(`R-Machine Error: ${msg}`);
  });
});
