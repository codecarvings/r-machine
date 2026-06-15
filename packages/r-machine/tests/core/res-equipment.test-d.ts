import { describe, expectTypeOf, it } from "vitest";
import type { AnyResAtlas } from "../../src/core/res-atlas.js";
import type { AnyResEquipment, ResEquipment } from "../../src/core/res-equipment.js";

// Pure-type file — type test only.
describe("ResEquipment", () => {
  it("defaults bridgeGears / gearKit / shellKit to empty when only RA is given", () => {
    expectTypeOf<ResEquipment<AnyResAtlas>["bridgeGears"]>().toEqualTypeOf<[]>();
    expectTypeOf<ResEquipment<AnyResAtlas>["gearKit"]>().toEqualTypeOf<{}>();
    expectTypeOf<ResEquipment<AnyResAtlas>["shellKit"]>().toEqualTypeOf<{}>();
  });

  it("a concrete ResEquipment is assignable to the erased AnyResEquipment", () => {
    expectTypeOf<ResEquipment<AnyResAtlas>>().toExtend<AnyResEquipment>();
  });
});
