import { describe, expectTypeOf, it } from "vitest";
import type {
  HrefMapper,
  HrefMapperFn,
  MappedHrefResult,
  MappedPath,
  MappedSegment,
  PathAtlasSegment,
} from "../../src/core/href-mapper.js";
import { buildPathAtlasSegmentTree, getSegmentData } from "../../src/core/href-mapper.js";

describe("getSegmentData", () => {
  it("accepts a segment string and returns SegmentData", () => {
    expectTypeOf(getSegmentData).toEqualTypeOf<
      (segment: string) => {
        readonly kind: "static" | "dynamic" | "catchAll" | "optionalCatchAll" | undefined;
        readonly paramKey: string | undefined;
      }
    >();
  });
});

describe("buildPathAtlasSegmentTree", () => {
  it("builds a PathAtlasSegment tree from declaration inputs", () => {
    expectTypeOf(buildPathAtlasSegmentTree).toEqualTypeOf<
      (segment: string, decl: object, locales: readonly string[], defaultLocale: string) => PathAtlasSegment
    >();
  });
});

describe("PathAtlasSegment", () => {
  it("defines a recursive segment tree with translations", () => {
    expectTypeOf<PathAtlasSegment>().toEqualTypeOf<{
      readonly kind: "static" | "dynamic" | "catchAll" | "optionalCatchAll" | undefined;
      readonly paramKey: string | undefined;
      readonly translations: { readonly [locale: string]: string };
      readonly children: { [key: string]: PathAtlasSegment };
    }>();
  });
});

describe("MappedSegment", () => {
  it("describes a single mapped path segment", () => {
    expectTypeOf<MappedSegment>().toEqualTypeOf<{
      readonly decl: boolean;
      readonly segment: string;
      readonly kind: "static" | "dynamic" | "catchAll" | "optionalCatchAll";
    }>();
  });
});

describe("MappedPath", () => {
  it("aggregates mapped segments with declaration and dynamic flags", () => {
    expectTypeOf<MappedPath>().toEqualTypeOf<{
      readonly decl: boolean;
      readonly dynamic: boolean;
      readonly segments: MappedSegment[];
    }>();
  });
});

describe("MappedHrefResult", () => {
  it("pairs a resolved href value with a dynamic flag", () => {
    expectTypeOf<MappedHrefResult>().toEqualTypeOf<{
      readonly value: string;
      readonly dynamic: boolean;
    }>();
  });
});

describe("HrefMapperFn", () => {
  it("returns MappedHrefResult", () => {
    expectTypeOf<HrefMapperFn>().returns.toEqualTypeOf<MappedHrefResult>();
  });

  it("is assignable from a minimal (locale, path) => MappedHrefResult", () => {
    expectTypeOf<(locale: string, path: string) => MappedHrefResult>().toMatchTypeOf<HrefMapperFn>();
  });

  it("is assignable from a function with extra args", () => {
    expectTypeOf<(locale: string, path: string, params: object) => MappedHrefResult>().toMatchTypeOf<HrefMapperFn>();
  });

  it("rejects a function that does not return MappedHrefResult", () => {
    expectTypeOf<(locale: string, path: string) => string>().not.toExtend<HrefMapperFn>();
  });
});

describe("HrefMapper", () => {
  it("exposes readonly locales and a string defaultLocale", () => {
    expectTypeOf<HrefMapper<HrefMapperFn>["locales"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<HrefMapper<HrefMapperFn>["defaultLocale"]>().toBeString();
  });

  it("types the get method according to the generic parameter F", () => {
    type TestFn = (locale: string, path: string) => MappedHrefResult;
    expectTypeOf<HrefMapper<TestFn>["get"]>().toEqualTypeOf<TestFn>();
  });
});
