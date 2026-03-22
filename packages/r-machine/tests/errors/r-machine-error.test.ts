import { describe, expect, it } from "vitest";
import { RMachineError } from "../../src/errors/r-machine-error.js";
import { describeErrorSubclass } from "../_fixtures/error-class-test-helper.js";

describeErrorSubclass("RMachineError", RMachineError);

describe("RMachineError (additional)", () => {
  it("should store innerError and support multi-level chaining", () => {
    const root = new Error("Root cause.");
    const middle = new RMachineError("ERR_MID", "Middle layer.", root);
    const top = new RMachineError("ERR_TOP", "Top layer.", middle);

    expect(middle.innerError).toBe(root);
    expect(top.innerError).toBe(middle);
    expect((top.innerError as RMachineError).innerError).toBe(root);
  });

  it("should preserve special characters in the message", () => {
    const msg = `quote "here" and newline\nand tab\t`;
    const error = new RMachineError("ERR_TEST", msg);
    expect(error.message).toBe(`R-Machine Error [ERR_TEST]: ${msg}`);
  });
});
