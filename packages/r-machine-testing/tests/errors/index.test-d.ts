import { describe, expectTypeOf, it } from "vitest";
import { ERR_PLUG_ALREADY_MOCKED, ERR_STATE_NOT_RESOLVED, ERR_VERIFY_SETUP_INVALID } from "../../src/errors/index.js";

// Barrel test: export completeness for the error-code surface. Each constant is
// a literal string code carried by the RMachineUsageError thrown at its site.
describe("@r-machine/testing errors barrel exports", () => {
  it("exports the expected error-code constants", () => {
    expectTypeOf(ERR_PLUG_ALREADY_MOCKED).toBeString();
    expectTypeOf(ERR_STATE_NOT_RESOLVED).toBeString();
    expectTypeOf(ERR_VERIFY_SETUP_INVALID).toBeString();
  });
});
