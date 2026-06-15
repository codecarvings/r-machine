import { describe, expectTypeOf, it } from "vitest";
import { RMachineConfigError } from "../../src/errors/r-machine-config-error.js";
import type { RMachineError } from "../../src/errors/r-machine-error.js";

// Subclass surface: extending RMachineError transitively carries Error + the
// `code`/`innerError` properties (asserted on the base), so only the things the
// subclass re-declares are pinned here — the inheritance link and its own
// constructor signature.
describe("RMachineConfigError", () => {
  it("extends RMachineError", () => {
    expectTypeOf<RMachineConfigError>().toExtend<RMachineError>();
  });

  it("is constructable with (code, message, innerError?)", () => {
    expectTypeOf(RMachineConfigError).constructorParameters.toEqualTypeOf<
      [code: string, message: string, innerError?: Error | undefined]
    >();
  });
});
