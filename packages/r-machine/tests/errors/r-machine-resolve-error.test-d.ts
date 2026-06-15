import { describe, expectTypeOf, it } from "vitest";
import type { RMachineError } from "../../src/errors/r-machine-error.js";
import { RMachineResolveError } from "../../src/errors/r-machine-resolve-error.js";

// Subclass surface — see r-machine-config-error.test-d.ts for the rationale on
// why only the inheritance link and constructor signature are pinned.
describe("RMachineResolveError", () => {
  it("extends RMachineError", () => {
    expectTypeOf<RMachineResolveError>().toExtend<RMachineError>();
  });

  it("is constructable with (code, message, innerError?)", () => {
    expectTypeOf(RMachineResolveError).constructorParameters.toEqualTypeOf<
      [code: string, message: string, innerError?: Error | undefined]
    >();
  });
});
