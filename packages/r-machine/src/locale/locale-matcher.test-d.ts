import { describe, expectTypeOf, test } from "vitest";
import { defaultAlgorithm, type MatchLocalesAlgorithm, matchLocales } from "./locale-matcher.js";

describe("MatchLocalesAlgorithm", () => {
  test("should be a union of 'best-fit' and 'lookup'", () => {
    expectTypeOf<MatchLocalesAlgorithm>().toEqualTypeOf<"best-fit" | "lookup">();
  });

  test("'best-fit' should be assignable to MatchLocalesAlgorithm", () => {
    expectTypeOf<"best-fit">().toExtend<MatchLocalesAlgorithm>();
  });

  test("'lookup' should be assignable to MatchLocalesAlgorithm", () => {
    expectTypeOf<"lookup">().toExtend<MatchLocalesAlgorithm>();
  });

  test("invalid string should not be assignable to MatchLocalesAlgorithm", () => {
    expectTypeOf<"invalid">().not.toExtend<MatchLocalesAlgorithm>();
  });
});

describe("defaultAlgorithm", () => {
  test("should be of type MatchLocalesAlgorithm", () => {
    expectTypeOf(defaultAlgorithm).toEqualTypeOf<MatchLocalesAlgorithm>();
  });
});

describe("matchLocales", () => {
  test("should accept readonly string arrays for requestedLocales", () => {
    expectTypeOf(matchLocales).parameter(0).toEqualTypeOf<readonly string[]>();
  });

  test("should accept readonly string arrays for availableLocales", () => {
    expectTypeOf(matchLocales).parameter(1).toEqualTypeOf<readonly string[]>();
  });

  test("should accept string for defaultLocale", () => {
    expectTypeOf(matchLocales).parameter(2).toEqualTypeOf<string>();
  });

  test("should return string", () => {
    expectTypeOf(matchLocales).returns.toEqualTypeOf<string>();
  });

  test("should accept options with algorithm property", () => {
    const result = matchLocales(["en"], ["en"], "en", { algorithm: "best-fit" });
    expectTypeOf(result).toEqualTypeOf<string>();
  });

  test("should accept options with undefined algorithm", () => {
    const result = matchLocales(["en"], ["en"], "en", { algorithm: undefined });
    expectTypeOf(result).toEqualTypeOf<string>();
  });

  test("should work without options", () => {
    const result = matchLocales(["en"], ["en"], "en");
    expectTypeOf(result).toEqualTypeOf<string>();
  });

  test("should work with empty options object", () => {
    const result = matchLocales(["en"], ["en"], "en", {});
    expectTypeOf(result).toEqualTypeOf<string>();
  });
});
