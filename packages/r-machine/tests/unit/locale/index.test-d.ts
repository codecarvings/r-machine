import { describe, expectTypeOf, it } from "vitest";
import type { MatchLocalesAlgorithm } from "../../../src/locale/index.js";
import {
  fullParseAcceptLanguageHeader,
  getCanonicalUnicodeLocaleId,
  matchLocales,
  parseAcceptLanguageHeader,
  validateCanonicalUnicodeLocaleId,
} from "../../../src/locale/index.js";

describe("locale barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).toBeFunction();

    expectTypeOf(validateCanonicalUnicodeLocaleId).toBeFunction();

    expectTypeOf<MatchLocalesAlgorithm>().toExtend<string>();

    expectTypeOf(matchLocales).toBeFunction();

    expectTypeOf(fullParseAcceptLanguageHeader).toBeFunction();

    expectTypeOf(parseAcceptLanguageHeader).toBeFunction();
  });
});
