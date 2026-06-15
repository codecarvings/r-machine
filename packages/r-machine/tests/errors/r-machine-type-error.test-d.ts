import { describe, expectTypeOf, it } from "vitest";
import type { RMachineTypeError } from "../../src/errors/r-machine-type-error.js";

// RMachineTypeError is a pure, runtime-less brand: there is nothing to execute,
// so it has a type test only (no `.test.ts`). The contract worth pinning is the
// diagnostic mechanism — the brand surfaces a literal message and, used as a
// type, refuses ordinary values so the wrong case fails to compile.
describe("RMachineTypeError", () => {
  it("brands the message under a readonly __rMachineTypeError carrying the literal", () => {
    expectTypeOf<RMachineTypeError<"nope">>().toEqualTypeOf<{ readonly __rMachineTypeError: "nope" }>();
    expectTypeOf<RMachineTypeError<"nope">>().toHaveProperty("__rMachineTypeError").toEqualTypeOf<"nope">();
  });

  it("distinguishes by message literal — different messages are different types", () => {
    expectTypeOf<RMachineTypeError<"a">>().not.toEqualTypeOf<RMachineTypeError<"b">>();
  });

  it("as a parameter type, rejects ordinary arguments so the message surfaces at the call site", () => {
    function guarded(_x: RMachineTypeError<"you must provide X">): void {}

    // The matching brand is the only accepted argument…
    guarded({ __rMachineTypeError: "you must provide X" });

    // @ts-expect-error - an ordinary value lacks the __rMachineTypeError brand
    guarded({ id: "1" });
    // @ts-expect-error - right shape but the wrong message literal is still rejected
    guarded({ __rMachineTypeError: "something else" });
  });

  it("does not satisfy the success type it guards (conditional-type success/failure pattern)", () => {
    // Usage: a conditional type returns `T` on success or RMachineTypeError<…> on
    // failure. The branded failure must NOT be assignable to the success type,
    // otherwise the guard would silently let the bad case through.
    type Success = { id: string };
    expectTypeOf<RMachineTypeError<"bad">>().not.toExtend<Success>();
  });
});
