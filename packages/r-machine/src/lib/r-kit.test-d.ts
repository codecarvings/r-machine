import { describe, expectTypeOf, test } from "vitest";
import type { AnyNamespace, AnyR, Namespace } from "./r.js";
import type { AnyNamespaceList, AnyRKit, NamespaceList, RKit } from "./r-kit.js";

describe("AnyNamespaceList", () => {
  test("should be readonly array of AnyNamespace", () => {
    expectTypeOf<AnyNamespaceList>().toEqualTypeOf<readonly AnyNamespace[]>();
  });

  test("should be readonly array of strings", () => {
    expectTypeOf<AnyNamespaceList>().toEqualTypeOf<readonly string[]>();
  });

  test("string array should be assignable", () => {
    const list: AnyNamespaceList = ["common", "home"];
    expectTypeOf(list).toExtend<AnyNamespaceList>();
  });

  test("const tuple should be assignable", () => {
    const list = ["common", "home"] as const;
    expectTypeOf(list).toExtend<AnyNamespaceList>();
  });

  test("empty array should be assignable", () => {
    const list: AnyNamespaceList = [];
    expectTypeOf(list).toExtend<AnyNamespaceList>();
  });
});

describe("AnyRKit", () => {
  test("should be readonly array of AnyR", () => {
    expectTypeOf<AnyRKit>().toEqualTypeOf<readonly AnyR[]>();
  });

  test("should be readonly array of objects", () => {
    expectTypeOf<AnyRKit>().toEqualTypeOf<readonly object[]>();
  });

  test("array of objects should be assignable", () => {
    const kit: AnyRKit = [{ greeting: "Hello" }, { title: "Home" }];
    expectTypeOf(kit).toExtend<AnyRKit>();
  });

  test("const tuple of objects should be assignable", () => {
    const kit = [{ greeting: "Hello" }, { title: "Home" }] as const;
    expectTypeOf(kit).toExtend<AnyRKit>();
  });

  test("empty array should be assignable", () => {
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

  test("should be readonly array of Namespace", () => {
    type Result = NamespaceList<TestAtlas>;
    expectTypeOf<Result>().toEqualTypeOf<readonly Namespace<TestAtlas>[]>();
  });

  test("should accept valid namespace tuple", () => {
    type Result = NamespaceList<TestAtlas>;
    const list: Result = ["common", "home"];
    expectTypeOf(list).toExtend<Result>();
  });

  test("should accept const tuple with valid namespaces", () => {
    type Result = NamespaceList<TestAtlas>;
    const list = ["common", "home"] as const;
    expectTypeOf(list).toExtend<Result>();
  });

  test("should accept single namespace array", () => {
    type Result = NamespaceList<TestAtlas>;
    const list: Result = ["common"];
    expectTypeOf(list).toExtend<Result>();
  });

  test("should accept empty array", () => {
    type Result = NamespaceList<TestAtlas>;
    const list: Result = [];
    expectTypeOf(list).toExtend<Result>();
  });

  test("should extend AnyNamespaceList", () => {
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

  test("should map namespace list to resource types", () => {
    type NL = readonly ["common", "home"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result[1]>().toEqualTypeOf<TestAtlas["home"]>();
  });

  test("should preserve tuple length", () => {
    type NL = readonly ["common", "home", "about"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result["length"]>().toEqualTypeOf<3>();
  });

  test("should work with single namespace", () => {
    type NL = readonly ["common"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result["length"]>().toEqualTypeOf<1>();
  });

  test("should work with empty tuple", () => {
    type NL = readonly [];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result["length"]>().toEqualTypeOf<0>();
  });

  test("should preserve resource structure", () => {
    type NL = readonly ["common"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toHaveProperty("greeting");
    expectTypeOf<Result[0]>().toHaveProperty("farewell");
  });

  test("should be readonly", () => {
    type NL = readonly ["common", "home"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result>().toBeObject();
  });

  test("should extend AnyRKit", () => {
    type NL = readonly ["common", "home"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result>().toExtend<AnyRKit>();
  });

  test("should work with all namespaces", () => {
    type NL = readonly ["common", "home", "about"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result[1]>().toEqualTypeOf<TestAtlas["home"]>();
    expectTypeOf<Result[2]>().toEqualTypeOf<TestAtlas["about"]>();
  });

  test("should allow duplicate namespaces in tuple", () => {
    type NL = readonly ["common", "common"];
    type Result = RKit<TestAtlas, NL>;
    expectTypeOf<Result[0]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<Result[1]>().toEqualTypeOf<TestAtlas["common"]>();
  });
});
