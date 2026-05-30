import { describe, expectTypeOf, it } from "vitest";
import { ReactStandardStrategy } from "../../src/lib/index.js";
import { ReactStandardStrategy as OriginalReactStandardStrategy } from "../../src/lib/react-standard-strategy.js";

// Barrel test: verify the lib entry re-exports ReactStandardStrategy (a class —
// compared at value level, so its 5 generic params don't need instantiating).
describe("lib barrel exports", () => {
  it("re-exports ReactStandardStrategy identical to the original", () => {
    expectTypeOf(ReactStandardStrategy).toEqualTypeOf(OriginalReactStandardStrategy);
  });
});
