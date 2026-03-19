import { describe, expectTypeOf, it } from "vitest";
import type { AnyLocale, AnyLocaleList, LocaleList } from "../../src/locale/index.js";
import {
  byLocale,
  getCanonicalUnicodeLocaleId,
  LocaleHelper,
  validateCanonicalUnicodeLocaleId,
} from "../../src/locale/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("locale barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).toBeFunction();

    expectTypeOf(validateCanonicalUnicodeLocaleId).toBeFunction();

    expectTypeOf<AnyLocale>().toEqualTypeOf<string>();
    expectTypeOf<AnyLocaleList>().toExtend<readonly AnyLocale[]>();
    expectTypeOf<LocaleList<"en" | "it">>().toExtend<readonly ("en" | "it")[]>();

    expectTypeOf(byLocale).toBeFunction();

    expectTypeOf(LocaleHelper).toBeConstructibleWith(["en", "it"] as const, "en");
  });
});
