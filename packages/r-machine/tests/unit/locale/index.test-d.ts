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
  it("should export getCanonicalUnicodeLocaleId as a function", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).toBeFunction();
  });

  it("should export validateCanonicalUnicodeLocaleId as a function", () => {
    expectTypeOf(validateCanonicalUnicodeLocaleId).toBeFunction();
  });

  it("should export MatchLocalesAlgorithm as a string union", () => {
    expectTypeOf<MatchLocalesAlgorithm>().toExtend<string>();
  });

  it("should export matchLocales as a function", () => {
    expectTypeOf(matchLocales).toBeFunction();
  });

  it("should export fullParseAcceptLanguageHeader as a function", () => {
    expectTypeOf(fullParseAcceptLanguageHeader).toBeFunction();
  });

  it("should export parseAcceptLanguageHeader as a function", () => {
    expectTypeOf(parseAcceptLanguageHeader).toBeFunction();
  });
});
