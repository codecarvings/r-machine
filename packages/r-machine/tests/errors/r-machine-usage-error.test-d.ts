import { describe, expectTypeOf, it } from "vitest";
import type { RMachineError } from "../../src/errors/r-machine-error.js";
import { RMachineUsageError } from "../../src/errors/r-machine-usage-error.js";

// Subclass surface — see r-machine-config-error.test-d.ts for the rationale on
// why only the inheritance link and constructor signature are pinned.
describe("RMachineUsageError", () => {
  it("extends RMachineError", () => {
    expectTypeOf<RMachineUsageError>().toExtend<RMachineError>();
  });

  it("is constructable with (code, message, innerError?)", () => {
    expectTypeOf(RMachineUsageError).constructorParameters.toEqualTypeOf<
      [code: string, message: string, innerError?: Error | undefined]
    >();
  });
});
