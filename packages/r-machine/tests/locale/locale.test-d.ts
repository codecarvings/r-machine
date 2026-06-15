import { describe, expectTypeOf, it } from "vitest";
import type { AnyLocale, AnyLocaleList, LocaleList } from "../../src/locale/locale.js";

// These are plain type aliases, so a type test is the only test. Assertions are
// exact (toEqualTypeOf) rather than structural (toExtend) so they catch the
// regressions that matter here: losing `readonly` or widening the element type.
describe("locale type aliases", () => {
  it("AnyLocale is string", () => {
    expectTypeOf<AnyLocale>().toEqualTypeOf<string>();
  });

  it("AnyLocaleList is a readonly array of AnyLocale", () => {
    expectTypeOf<AnyLocaleList>().toEqualTypeOf<readonly string[]>();
  });

  it("LocaleList<L> is a readonly array preserving the literal L", () => {
    expectTypeOf<LocaleList<"en" | "it">>().toEqualTypeOf<readonly ("en" | "it")[]>();
    // A mutable array would drop the readonly contract.
    expectTypeOf<("en" | "it")[]>().not.toEqualTypeOf<LocaleList<"en" | "it">>();
    // The element type must stay narrow, not widen to AnyLocale.
    expectTypeOf<LocaleList<"en" | "it">>().not.toEqualTypeOf<readonly string[]>();
  });
});
