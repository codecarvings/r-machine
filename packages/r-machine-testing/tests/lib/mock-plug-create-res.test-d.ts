import { describe, expectTypeOf, it } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { r as counter } from "../fixtures/mock-plug/outer-counter.js";

// `createRes()` is gated at the overload level: it appears ONLY when a
// `ResMatrix` is passed to `mockPlug` (gear/shell). A bare plug can't
// instantiate, so its controller must NOT carry the method.
describe("mockPlug — createRes gating (type-level)", () => {
  it("exposes a typed createRes on a controller built from a ResMatrix", () => {
    const ctrl = mockPlug(counter).default();
    expectTypeOf(ctrl).toHaveProperty("createRes");
    expectTypeOf(ctrl.createRes).toBeFunction();
    // Returns the TestSurface: a getter member reads as a value property.
    expectTypeOf(ctrl.createRes).returns.resolves.toHaveProperty("count");
    expectTypeOf<Awaited<ReturnType<typeof ctrl.createRes>>["count"]>().toEqualTypeOf<number>();
  });

  it("does NOT expose createRes on a controller built from a bare plug", () => {
    const ctrl = mockPlug(counter.plug).default();
    expectTypeOf<"createRes">().not.toExtend<keyof typeof ctrl>();
  });
});
