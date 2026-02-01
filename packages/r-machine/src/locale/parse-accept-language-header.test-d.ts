import { describe, expectTypeOf, test } from "vitest";
import {
  type AcceptLanguageEntry,
  fullParseAcceptLanguageHeader,
  parseAcceptLanguageHeader,
} from "./parse-accept-language-header.js";

describe("AcceptLanguageEntry", () => {
  test("should have range property of type string", () => {
    expectTypeOf<AcceptLanguageEntry["range"]>().toEqualTypeOf<string>();
  });

  test("should have quality property of type number", () => {
    expectTypeOf<AcceptLanguageEntry["quality"]>().toEqualTypeOf<number>();
  });

  test("should have exactly two properties", () => {
    expectTypeOf<keyof AcceptLanguageEntry>().toEqualTypeOf<"range" | "quality">();
  });
});

describe("fullParseAcceptLanguageHeader", () => {
  test("should accept string parameter", () => {
    expectTypeOf(fullParseAcceptLanguageHeader).parameter(0).toEqualTypeOf<string>();
  });

  test("should return AcceptLanguageEntry array", () => {
    expectTypeOf(fullParseAcceptLanguageHeader).returns.toEqualTypeOf<AcceptLanguageEntry[]>();
  });

  test("should have correct function signature", () => {
    expectTypeOf(fullParseAcceptLanguageHeader).toEqualTypeOf<(header: string) => AcceptLanguageEntry[]>();
  });

  test("return value should be iterable of AcceptLanguageEntry", () => {
    const result = fullParseAcceptLanguageHeader("en-US");
    expectTypeOf(result).items.toEqualTypeOf<AcceptLanguageEntry>();
  });
});

describe("parseAcceptLanguageHeader", () => {
  test("should accept string parameter", () => {
    expectTypeOf(parseAcceptLanguageHeader).parameter(0).toEqualTypeOf<string>();
  });

  test("should return string array", () => {
    expectTypeOf(parseAcceptLanguageHeader).returns.toEqualTypeOf<string[]>();
  });

  test("should have correct function signature", () => {
    expectTypeOf(parseAcceptLanguageHeader).toEqualTypeOf<(header: string) => string[]>();
  });

  test("return value should be iterable of strings", () => {
    const result = parseAcceptLanguageHeader("en-US");
    expectTypeOf(result).items.toEqualTypeOf<string>();
  });
});
