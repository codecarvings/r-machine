import type { AnyLocale, AnyResourceAtlas } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { ReactStandardStrategy } from "../../src/lib/index.js";
import type { ReactStandardStrategy as OriginalReactStandardStrategy } from "../../src/lib/react-standard-strategy.js";

describe("lib barrel exports", () => {
  it("re-exports ReactStandardStrategy identical to the original", () => {
    expectTypeOf<ReactStandardStrategy<AnyResourceAtlas, AnyLocale>>().toEqualTypeOf<
      OriginalReactStandardStrategy<AnyResourceAtlas, AnyLocale>
    >();
  });
});
