import { describe, expectTypeOf, it } from "vitest";
import { getCanonicalizedHref, HrefCanonicalizer } from "../../src/core/href-canonicalizer.js";
import type { HrefMapper, MappedHrefResult, MappedSegment } from "../../src/core/href-mapper.js";
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

describe("getCanonicalizedHref", () => {
  it("accepts MappedSegment[] and returns string", () => {
    expectTypeOf(getCanonicalizedHref).toEqualTypeOf<(mappedSegments: MappedSegment[]) => string>();
  });
});
