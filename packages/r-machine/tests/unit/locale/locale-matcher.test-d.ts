import { describe, expectTypeOf, it } from "vitest";
import { defaultAlgorithm, type MatchLocalesAlgorithm, matchLocales } from "../../../src/locale/locale-matcher.js";

describe("MatchLocalesAlgorithm", () => {
  it("should be a union of 'best-fit' and 'lookup'", () => {
    expectTypeOf<MatchLocalesAlgorithm>().toEqualTypeOf<"best-fit" | "lookup">();
  });

  it("'best-fit' should be assignable to MatchLocalesAlgorithm", () => {
    expectTypeOf<"best-fit">().toExtend<MatchLocalesAlgorithm>();
  });

  it("'lookup' should be assignable to MatchLocalesAlgorithm", () => {
    expectTypeOf<"lookup">().toExtend<MatchLocalesAlgorithm>();
  });

  it("invalid string should not be assignable to MatchLocalesAlgorithm", () => {
    expectTypeOf<"invalid">().not.toExtend<MatchLocalesAlgorithm>();
  });
});

describe("defaultAlgorithm", () => {
  it("should be of type MatchLocalesAlgorithm", () => {
    expectTypeOf(defaultAlgorithm).toEqualTypeOf<MatchLocalesAlgorithm>();
  });
});

describe("matchLocales", () => {
  it("should accept readonly string arrays for requestedLocales", () => {
    expectTypeOf(matchLocales).parameter(0).toEqualTypeOf<readonly string[]>();
  });

  it("should accept readonly string arrays for availableLocales", () => {
    expectTypeOf(matchLocales).parameter(1).toEqualTypeOf<readonly string[]>();
  });

  it("should accept string for defaultLocale", () => {
    expectTypeOf(matchLocales).parameter(2).toEqualTypeOf<string>();
  });

  it("should return string", () => {
    expectTypeOf(matchLocales).returns.toEqualTypeOf<string>();
  });

  it("should accept options with algorithm property", () => {
    const result = matchLocales(["en"], ["en"], "en", { algorithm: "best-fit" });
    expectTypeOf(result).toEqualTypeOf<string>();
  });

  it("should accept options with undefined algorithm", () => {
    const result = matchLocales(["en"], ["en"], "en", { algorithm: undefined });
    expectTypeOf(result).toEqualTypeOf<string>();
  });

  it("should work without options", () => {
    const result = matchLocales(["en"], ["en"], "en");
    expectTypeOf(result).toEqualTypeOf<string>();
  });

  it("should work with empty options object", () => {
    const result = matchLocales(["en"], ["en"], "en", {});
    expectTypeOf(result).toEqualTypeOf<string>();
  });
});
