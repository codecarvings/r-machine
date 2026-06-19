import { describe, expectTypeOf, it } from "vitest";
import type { AnyResAtlas, DirectPlugDefiner, DirectPlugKitMap } from "../../src/core/index.js";
import { getResFamilyFromLayoutType } from "../../src/core/index.js";

// Barrel test: verifies the core barrel re-exports the public DirectPlug surface
// (the definer + its config kit-map) and the `getResFamilyFromLayoutType` helper
// the lib toolset relies on. The plugin-shape types (DirectMapPlugin/…/Ctx) are
// intentionally module-internal and not part of the barrel. Type-shape behavior
// is covered in tests/lib/direct-plug.test-d.ts.
describe("core barrel exports (DirectPlug surface)", () => {
  it("re-exports the public DirectPlug types and the res-family helper", () => {
    expectTypeOf(getResFamilyFromLayoutType).toBeFunction();

    expectTypeOf<DirectPlugKitMap<AnyResAtlas>>().toBeObject();
    expectTypeOf<DirectPlugDefiner<AnyResAtlas, string, {}>>().toBeFunction();
  });
});
