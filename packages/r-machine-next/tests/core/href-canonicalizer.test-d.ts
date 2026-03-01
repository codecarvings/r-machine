import { describe, expectTypeOf, it } from "vitest";
import { getCanonicalizedHref, HrefCanonicalizer } from "../../src/core/href-canonicalizer.js";
import type { HrefMapper, MappedHrefResult, MappedSegment } from "../../src/core/href-mapper.js";
import type { HrefTranslator } from "../../src/core/href-translator.js";
import type { AnyPathAtlas } from "../../src/core/path-atlas.js";

describe("HrefCanonicalizer", () => {
  it("is constructible with (AnyPathAtlas, readonly string[], string)", () => {
    expectTypeOf(HrefCanonicalizer).toBeConstructibleWith({} as AnyPathAtlas, ["en", "it"] as const, "en");
  });

  it("extends HrefMapper", () => {
    expectTypeOf<HrefCanonicalizer>().toExtend<HrefMapper<(locale: string, path: string) => MappedHrefResult>>();
  });

  it("get accepts locale as first parameter", () => {
    expectTypeOf<HrefCanonicalizer["get"]>().parameter(0).toBeString();
  });

  it("get accepts path as second parameter", () => {
    expectTypeOf<HrefCanonicalizer["get"]>().parameter(1).toBeString();
  });

  it("get returns MappedHrefResult", () => {
    expectTypeOf<HrefCanonicalizer["get"]>().returns.toEqualTypeOf<MappedHrefResult>();
  });
});

describe("HrefCanonicalizer - negative constructor tests", () => {
  it("rejects construction without arguments", () => {
    // @ts-expect-error - all three arguments are required
    new HrefCanonicalizer();
  });

  it("rejects construction with wrong atlas type", () => {
    // @ts-expect-error - first argument must be AnyPathAtlas
    new HrefCanonicalizer("not atlas", ["en"], "en");
  });

  it("rejects construction with non-array locales", () => {
    // @ts-expect-error - second argument must be readonly string[]
    new HrefCanonicalizer({} as AnyPathAtlas, "en", "en");
  });

  it("rejects construction with non-string defaultLocale", () => {
    // @ts-expect-error - third argument must be string
    new HrefCanonicalizer({} as AnyPathAtlas, ["en"], 42);
  });
});

describe("HrefCanonicalizer - type discrimination", () => {
  it("get signature differs from HrefTranslator get", () => {
    expectTypeOf<HrefCanonicalizer["get"]>().not.toEqualTypeOf<HrefTranslator["get"]>();
  });
});

describe("getCanonicalizedHref", () => {
  it("accepts MappedSegment[] and returns string", () => {
    expectTypeOf(getCanonicalizedHref).toEqualTypeOf<(mappedSegments: MappedSegment[]) => string>();
  });
});
