import { describe, expectTypeOf, it } from "vitest";
import {
  type AcceptLanguageEntry,
  fullParseAcceptLanguageHeader,
  parseAcceptLanguageHeader,
} from "../../src/locale/parse-accept-language-header.js";

describe("AcceptLanguageEntry", () => {
  it("is exactly { readonly range: string; readonly quality: number }", () => {
    // Exact match pins the property set, their types, and readonly-ness in one go.
    expectTypeOf<AcceptLanguageEntry>().toEqualTypeOf<{ readonly range: string; readonly quality: number }>();
  });
});

describe("parse signatures", () => {
  it("fullParseAcceptLanguageHeader: (header: string) => readonly AcceptLanguageEntry[]", () => {
    expectTypeOf(fullParseAcceptLanguageHeader).toEqualTypeOf<(header: string) => readonly AcceptLanguageEntry[]>();
  });

  it("parseAcceptLanguageHeader: (header: string) => readonly string[]", () => {
    expectTypeOf(parseAcceptLanguageHeader).toEqualTypeOf<(header: string) => readonly string[]>();
  });
});
