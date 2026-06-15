import { describe, expectTypeOf, it } from "vitest";
import { defaultAlgorithm, type MatchLocalesAlgorithm, matchLocales } from "../../src/locale/locale-matcher.js";

describe("MatchLocalesAlgorithm", () => {
  it("is exactly 'best-fit' | 'lookup'", () => {
    // Exact match already pins membership and excludes anything else, so the
    // per-member assignable / not-assignable checks would be tautological.
    expectTypeOf<MatchLocalesAlgorithm>().toEqualTypeOf<"best-fit" | "lookup">();
  });
});

describe("defaultAlgorithm", () => {
  it("is a MatchLocalesAlgorithm", () => {
    expectTypeOf(defaultAlgorithm).toEqualTypeOf<MatchLocalesAlgorithm>();
  });
});

describe("matchLocales", () => {
  it("takes (readonly string[], readonly string[], string, options?) and returns string", () => {
    expectTypeOf(matchLocales).parameter(0).toEqualTypeOf<readonly string[]>();
    expectTypeOf(matchLocales).parameter(1).toEqualTypeOf<readonly string[]>();
    expectTypeOf(matchLocales).parameter(2).toEqualTypeOf<string>();
    expectTypeOf(matchLocales).returns.toEqualTypeOf<string>();
  });

  it("accepts an optional options arg whose algorithm is itself optional", () => {
    // No full-signature assertion is possible — MatchLocalesOptions is internal —
    // so these calls are what pins the 4th-parameter surface.
    expectTypeOf(matchLocales(["en"], ["en"], "en")).toEqualTypeOf<string>();
    expectTypeOf(matchLocales(["en"], ["en"], "en", {})).toEqualTypeOf<string>();
    expectTypeOf(matchLocales(["en"], ["en"], "en", { algorithm: "lookup" })).toEqualTypeOf<string>();
    expectTypeOf(matchLocales(["en"], ["en"], "en", { algorithm: undefined })).toEqualTypeOf<string>();
  });
});
