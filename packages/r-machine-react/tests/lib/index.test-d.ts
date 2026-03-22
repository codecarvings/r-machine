import type { AnyFmtProvider, AnyResourceAtlas } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { ReactStandardStrategy } from "../../src/lib/index.js";
import type { ReactStandardStrategy as OriginalReactStandardStrategy } from "../../src/lib/react-standard-strategy.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("lib barrel exports", () => {
  it("re-exports ReactStandardStrategy identical to the original", () => {
    expectTypeOf<ReactStandardStrategy<AnyResourceAtlas, AnyLocale, AnyFmtProvider>>().toEqualTypeOf<
      OriginalReactStandardStrategy<AnyResourceAtlas, AnyLocale, AnyFmtProvider>
    >();
  });
});
