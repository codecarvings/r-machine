import { describe, expectTypeOf, it } from "vitest";
import {
  type AcceptLanguageEntry,
  fullParseAcceptLanguageHeader,
  parseAcceptLanguageHeader,
} from "../../src/locale/parse-accept-language-header.js";

describe("AcceptLanguageEntry", () => {
  it("should have range property of type string", () => {
    expectTypeOf<AcceptLanguageEntry["range"]>().toEqualTypeOf<string>();
  });

  it("should have quality property of type number", () => {
    expectTypeOf<AcceptLanguageEntry["quality"]>().toEqualTypeOf<number>();
  });

  it("should have exactly two properties", () => {
    expectTypeOf<keyof AcceptLanguageEntry>().toEqualTypeOf<"range" | "quality">();
  });
});

describe("fullParseAcceptLanguageHeader", () => {
  it("should accept string parameter", () => {
    expectTypeOf(fullParseAcceptLanguageHeader).parameter(0).toEqualTypeOf<string>();
  });

  it("should return AcceptLanguageEntry array", () => {
    expectTypeOf(fullParseAcceptLanguageHeader).returns.toEqualTypeOf<AcceptLanguageEntry[]>();
  });

  it("should have correct function signature", () => {
    expectTypeOf(fullParseAcceptLanguageHeader).toEqualTypeOf<(header: string) => AcceptLanguageEntry[]>();
  });

  it("return value should be iterable of AcceptLanguageEntry", () => {
    const result = fullParseAcceptLanguageHeader("en-US");
    expectTypeOf(result).items.toEqualTypeOf<AcceptLanguageEntry>();
  });
});

describe("parseAcceptLanguageHeader", () => {
  it("should accept string parameter", () => {
    expectTypeOf(parseAcceptLanguageHeader).parameter(0).toEqualTypeOf<string>();
  });

  it("should return string array", () => {
    expectTypeOf(parseAcceptLanguageHeader).returns.toEqualTypeOf<string[]>();
  });

  it("should have correct function signature", () => {
    expectTypeOf(parseAcceptLanguageHeader).toEqualTypeOf<(header: string) => string[]>();
  });

  it("return value should be iterable of strings", () => {
    const result = parseAcceptLanguageHeader("en-US");
    expectTypeOf(result).items.toEqualTypeOf<string>();
  });
});
