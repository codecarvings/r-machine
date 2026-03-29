import { describe, expectTypeOf, it } from "vitest";
import type { NamespaceMap, RMap } from "../../src/lib/r-map.js";

type TestAtlas = {
  readonly common: { greeting: string };
  readonly nav: { home: string; about: string };
  readonly footer: { copyright: string };
};

describe("NamespaceMap", () => {
  it("should accept valid namespace aliases", () => {
    type NM = NamespaceMap<TestAtlas>;
    const map: NM = { c: "common", n: "nav" };
    expectTypeOf(map).toExtend<NM>();
  });

  it("should reject namespace names not in the atlas", () => {
    type NM = NamespaceMap<TestAtlas>;
    // @ts-expect-error - "invalid" is not a namespace of TestAtlas
    const _bad: NM = { x: "invalid" };
  });

  it("should allow empty map", () => {
    const map: NamespaceMap<TestAtlas> = {};
    expectTypeOf(map).toExtend<NamespaceMap<TestAtlas>>();
  });
});

describe("RMap", () => {
  it("should resolve namespace aliases to their resource types", () => {
    type NM = { readonly c: "common"; readonly n: "nav" };
    type Result = RMap<TestAtlas, NM>;
    expectTypeOf<Result["c"]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result["n"]>().toEqualTypeOf<TestAtlas["nav"]>();
  });

  it("should preserve the alias keys", () => {
    type NM = { readonly x: "common"; readonly y: "footer" };
    type Result = RMap<TestAtlas, NM>;
    type Keys = keyof Result;
    expectTypeOf<Keys>().toEqualTypeOf<"x" | "y">();
  });

  it("should handle single entry", () => {
    type NM = { readonly only: "common" };
    type Result = RMap<TestAtlas, NM>;
    expectTypeOf<Result["only"]>().toEqualTypeOf<{ greeting: string }>();
  });

  it("should handle empty map", () => {
    type Result = RMap<TestAtlas, {}>;
    type Keys = keyof Result;
    expectTypeOf<Keys>().toEqualTypeOf<never>();
  });

  it("should allow multiple aliases to the same namespace", () => {
    type NM = { readonly a: "common"; readonly b: "common" };
    type Result = RMap<TestAtlas, NM>;
    expectTypeOf<Result["a"]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result["b"]>().toEqualTypeOf<TestAtlas["common"]>();
  });

  it("should be readonly", () => {
    type NM = { readonly c: "common" };
    type Result = RMap<TestAtlas, NM>;
    expectTypeOf<Result>().toEqualTypeOf<Readonly<Result>>();
  });
});
