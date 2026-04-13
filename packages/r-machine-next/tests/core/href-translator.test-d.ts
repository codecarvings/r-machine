import { describe, expectTypeOf, it } from "vitest";
import type { HrefCanonicalizer } from "../../src/core/href-canonicalizer.js";
import type { HrefMapper, MappedHrefResult, MappedSegment } from "../../src/core/href-mapper.js";
import { getTranslatedHref, HrefTranslator } from "../../src/core/href-translator.js";
import type { AnyPathAtlas } from "../../src/core/path-atlas.js";

describe("HrefTranslator", () => {
  it("is constructible with (AnyPathAtlas, readonly string[], string)", () => {
    expectTypeOf(HrefTranslator).toBeConstructibleWith({} as AnyPathAtlas, ["en", "it"] as const, "en");
  });

  it("extends HrefMapper", () => {
    expectTypeOf<HrefTranslator>().toExtend<
      HrefMapper<(locale: string, path: string, params?: object) => MappedHrefResult>
    >();
  });

  it("get accepts locale as first parameter", () => {
    expectTypeOf<HrefTranslator["get"]>().parameter(0).toBeString();
  });

  it("get accepts path as second parameter", () => {
    expectTypeOf<HrefTranslator["get"]>().parameter(1).toBeString();
  });

  it("get accepts an optional params object as third parameter", () => {
    expectTypeOf<HrefTranslator["get"]>().parameter(2).toEqualTypeOf<object | undefined>();
  });

  it("get returns MappedHrefResult", () => {
    expectTypeOf<HrefTranslator["get"]>().returns.toEqualTypeOf<MappedHrefResult>();
  });
});

describe("HrefTranslator - negative constructor tests", () => {
  it("rejects construction without arguments", () => {
    // @ts-expect-error - all three arguments are required
    new HrefTranslator();
  });

  it("rejects construction with wrong atlas type", () => {
    // @ts-expect-error - first argument must be AnyPathAtlas
    new HrefTranslator("not atlas", ["en"], "en");
  });

  it("rejects construction with non-array locales", () => {
    // @ts-expect-error - second argument must be readonly string[]
    new HrefTranslator({} as AnyPathAtlas, "en", "en");
  });

  it("rejects construction with non-string defaultLocale", () => {
    // @ts-expect-error - third argument must be string
    new HrefTranslator({} as AnyPathAtlas, ["en"], 42);
  });
});

describe("HrefTranslator - type discrimination", () => {
  it("get signature differs from HrefCanonicalizer get", () => {
    expectTypeOf<HrefTranslator["get"]>().not.toEqualTypeOf<HrefCanonicalizer["get"]>();
  });
});

describe("getTranslatedHref", () => {
  it("accepts (locale, path, MappedSegment[], params?) and returns string", () => {
    expectTypeOf(getTranslatedHref).toEqualTypeOf<
      (locale: string, path: string, mappedSegments: MappedSegment[], params?: object) => string
    >();
  });
});
