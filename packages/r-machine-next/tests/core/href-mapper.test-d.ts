import { describe, expectTypeOf, it } from "vitest";
import type {
  HrefMapper,
  HrefMapperFn,
  MappedHrefResult,
  MappedPath,
  MappedSegment,
  SegmentNode,
} from "../../src/core/href-mapper.js";
import { buildSegmentNodeTree, getSegmentData } from "../../src/core/href-mapper.js";
import type { AnySegment } from "../../src/core/path-atlas.js";

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

describe("buildSegmentNodeTree", () => {
  it("builds a SegmentNode tree from declaration inputs", () => {
    expectTypeOf(buildSegmentNodeTree).toEqualTypeOf<
      (segment: string, source: AnySegment, locales: readonly string[], defaultLocale: string) => SegmentNode
    >();
  });
});

describe("SegmentNode", () => {
  it("defines a recursive segment tree with translations", () => {
    expectTypeOf<SegmentNode>().toEqualTypeOf<{
      readonly kind: "static" | "dynamic" | "catchAll" | "optionalCatchAll" | undefined;
      readonly paramKey: string | undefined;
      readonly translations: { readonly [locale: string]: string };
      readonly children: { [key: string]: SegmentNode };
    }>();
  });
});

describe("MappedSegment", () => {
  it("describes a single mapped path segment", () => {
    expectTypeOf<MappedSegment>().toEqualTypeOf<{
      readonly declared: boolean;
      readonly segment: string;
      readonly kind: "static" | "dynamic" | "catchAll" | "optionalCatchAll";
    }>();
  });
});

describe("MappedPath", () => {
  it("aggregates mapped segments with declaration and dynamic flags", () => {
    expectTypeOf<MappedPath>().toEqualTypeOf<{
      readonly declared: boolean;
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
