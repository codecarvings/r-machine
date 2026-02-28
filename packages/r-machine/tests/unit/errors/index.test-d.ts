import { describe, expectTypeOf, it } from "vitest";
import type { RMachineError } from "../../../src/errors/index.js";

describe("errors barrel exports", () => {
  it("should export RMachineError as a class extending Error", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
    expectTypeOf<RMachineError>().toHaveProperty("innerError");
  });
});
