import { describe, expectTypeOf, it } from "vitest";
import type { AnyNamespace, AnyR, Namespace } from "../../src/lib/r.js";
import type { AnyNamespaceList, AnyRKit, NamespaceList, RKit } from "../../src/lib/r-kit.js";

describe("AnyNamespaceList", () => {
  it("should be readonly array of AnyNamespace", () => {
    expectTypeOf<AnyNamespaceList>().toEqualTypeOf<readonly AnyNamespace[]>();
  });

  it("should be readonly array of strings", () => {
    expectTypeOf<AnyNamespaceList>().toEqualTypeOf<readonly string[]>();
  });

  it("string array should be assignable", () => {
    const list: AnyNamespaceList = ["common", "home"];
    expectTypeOf(list).toExtend<AnyNamespaceList>();
  });

  it("const tuple should be assignable", () => {
    const list = ["common", "home"] as const;
    expectTypeOf(list).toExtend<AnyNamespaceList>();
  });

  it("empty array should be assignable", () => {
    const list: AnyNamespaceList = [];
    expectTypeOf(list).toExtend<AnyNamespaceList>();
  });
});

describe("AnyRKit", () => {
  it("should be readonly array of AnyR", () => {
    expectTypeOf<AnyRKit>().toEqualTypeOf<readonly AnyR[]>();
  });

  it("should be readonly array of objects", () => {
    expectTypeOf<AnyRKit>().toEqualTypeOf<readonly object[]>();
  });

  it("array of objects should be assignable", () => {
    const kit: AnyRKit = [{ greeting: "Hello" }, { title: "Home" }];
    expectTypeOf(kit).toExtend<AnyRKit>();
  });

  it("const tuple of objects should be assignable", () => {
    const kit = [{ greeting: "Hello" }, { title: "Home" }] as const;
    expectTypeOf(kit).toExtend<AnyRKit>();
  });

  it("empty array should be assignable", () => {
    const kit: AnyRKit = [];
    expectTypeOf(kit).toExtend<AnyRKit>();
  });
});

describe("NamespaceList", () => {
  type TestAtlas = {
    readonly common: { greeting: string };
    readonly home: { title: string };
    readonly about: { description: string };
  };

  it("should be readonly array of Namespace", () => {
    type Result = NamespaceList<TestAtlas>;
    expectTypeOf<Result>().toEqualTypeOf<readonly Namespace<TestAtlas>[]>();
  });

  it("should accept valid namespace tuple", () => {
    type Result = NamespaceList<TestAtlas>;
    const list: Result = ["common", "home"];
    expectTypeOf(list).toExtend<Result>();
  });

  it("should accept const tuple with valid namespaces", () => {
    type Result = NamespaceList<TestAtlas>;
    const list = ["common", "home"] as const;
    expectTypeOf(list).toExtend<Result>();
  });

  it("should accept single namespace array", () => {
    type Result = NamespaceList<TestAtlas>;
    const list: Result = ["common"];
    expectTypeOf(list).toExtend<Result>();
  });

  it("should accept empty array", () => {
    type Result = NamespaceList<TestAtlas>;
    const list: Result = [];
    expectTypeOf(list).toExtend<Result>();
  });

  it("should extend AnyNamespaceList", () => {
    type Result = NamespaceList<TestAtlas>;
    expectTypeOf<Result>().toExtend<AnyNamespaceList>();
  });
});

describe("RKit", () => {
  type TestAtlas = {
    readonly common: { greeting: string; farewell: string };
    readonly home: { title: string };
    readonly about: { description: string };
  };

  it("should map namespace list to resource types", () => {
    type NL = readonly ["common", "home"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result[1]>().toEqualTypeOf<TestAtlas["home"]>();
  });

  it("should preserve tuple length", () => {
    type NL = readonly ["common", "home", "about"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result["length"]>().toEqualTypeOf<3>();
  });

  it("should work with single namespace", () => {
    type NL = readonly ["common"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result["length"]>().toEqualTypeOf<1>();
  });

  it("should work with empty tuple", () => {
    type NL = readonly [];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result["length"]>().toEqualTypeOf<0>();
  });

  it("should preserve resource structure", () => {
    type NL = readonly ["common"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toHaveProperty("greeting");
    expectTypeOf<Result[0]>().toHaveProperty("farewell");
  });

  it("should be readonly", () => {
    type NL = readonly ["common", "home"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result>().toBeObject();
  });

  it("should extend AnyRKit", () => {
    type NL = readonly ["common", "home"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result>().toExtend<AnyRKit>();
  });

  it("should work with all namespaces", () => {
    type NL = readonly ["common", "home", "about"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result[1]>().toEqualTypeOf<TestAtlas["home"]>();
    expectTypeOf<Result[2]>().toEqualTypeOf<TestAtlas["about"]>();
  });

  it("should allow duplicate namespaces in tuple", () => {
    type NL = readonly ["common", "common"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result[1]>().toEqualTypeOf<TestAtlas["common"]>();
  });
});
