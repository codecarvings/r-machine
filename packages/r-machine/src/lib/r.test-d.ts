import { describe, expectTypeOf, test } from "vitest";
import type { AnyNamespace, AnyR, AnyResourceAtlas, Namespace, R } from "./r.js";
import type { AnyRForge, R$ } from "./r-module.js";

describe("AnyNamespace", () => {
  test("should be string type", () => {
    expectTypeOf<AnyNamespace>().toEqualTypeOf<string>();
  });

  test("string should be assignable to AnyNamespace", () => {
    expectTypeOf<string>().toExtend<AnyNamespace>();
  });

  test("string literal should be assignable to AnyNamespace", () => {
    expectTypeOf<"my-namespace">().toExtend<AnyNamespace>();
  });
});

describe("AnyR", () => {
  test("should be object type", () => {
    expectTypeOf<AnyR>().toEqualTypeOf<object>();
  });

  test("object should be assignable to AnyR", () => {
    expectTypeOf<object>().toExtend<AnyR>();
  });

  test("record type should be assignable to AnyR", () => {
    expectTypeOf<{ key: string }>().toExtend<AnyR>();
  });

  test("null should not be assignable to AnyR", () => {
    expectTypeOf<null>().not.toExtend<AnyR>();
  });

  test("undefined should not be assignable to AnyR", () => {
    expectTypeOf<undefined>().not.toExtend<AnyR>();
  });

  test("primitive types should not be assignable to AnyR", () => {
    expectTypeOf<string>().not.toExtend<AnyR>();
    expectTypeOf<number>().not.toExtend<AnyR>();
    expectTypeOf<boolean>().not.toExtend<AnyR>();
  });
});

describe("AnyResourceAtlas", () => {
  test("should be an object type", () => {
    expectTypeOf<AnyResourceAtlas>().toBeObject();
  });

  test("should have index signature with AnyNamespace keys", () => {
    type AtlasValue = AnyResourceAtlas[string];
    expectTypeOf<AtlasValue>().toEqualTypeOf<AnyRForge>();
  });

  test("valid resource atlas should be assignable", () => {
    const atlas: AnyResourceAtlas = {
      common: { greeting: "Hello" },
      home: { title: "Welcome" },
    };
    expectTypeOf(atlas).toExtend<AnyResourceAtlas>();
  });

  test("resource atlas with factory should be assignable", () => {
    const atlas: AnyResourceAtlas = {
      common: ($: R$) => ({ greeting: `Hello from ${$.locale}` }),
    };
    expectTypeOf(atlas).toExtend<AnyResourceAtlas>();
  });

  test("resource atlas with async factory should be assignable", () => {
    const atlas: AnyResourceAtlas = {
      common: async ($: R$) => ({ greeting: `Hello from ${$.locale}` }),
    };
    expectTypeOf(atlas).toExtend<AnyResourceAtlas>();
  });
});

describe("Namespace", () => {
  test("should extract string keys from ResourceAtlas", () => {
    type TestAtlas = {
      readonly common: { greeting: string };
      readonly home: { title: string };
    };
    expectTypeOf<Namespace<TestAtlas>>().toEqualTypeOf<"common" | "home">();
  });

  test("should work with single namespace", () => {
    type TestAtlas = {
      readonly common: { greeting: string };
    };
    expectTypeOf<Namespace<TestAtlas>>().toEqualTypeOf<"common">();
  });

  test("should be assignable to AnyNamespace", () => {
    type TestAtlas = {
      readonly common: { greeting: string };
    };
    expectTypeOf<Namespace<TestAtlas>>().toExtend<AnyNamespace>();
  });

  test("should extract only string keys", () => {
    type TestAtlas = {
      readonly common: { greeting: string };
      readonly home: { title: string };
    };
    type NS = Namespace<TestAtlas>;
    expectTypeOf<NS>().toExtend<string>();
  });
});

describe("R", () => {
  test("should extract type from object forge", () => {
    type ResourceObject = { greeting: string; farewell: string };
    type Result = R<ResourceObject>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  test("should extract type from sync factory", () => {
    type ResourceObject = { greeting: string };
    type Factory = ($: R$) => ResourceObject;
    type Result = R<Factory>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  test("should extract type from async factory", () => {
    type ResourceObject = { greeting: string };
    type AsyncFactory = ($: R$) => Promise<ResourceObject>;
    type Result = R<AsyncFactory>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  test("should preserve resource structure from object", () => {
    type Resource = { title: string; count: number };
    type Result = R<Resource>;
    expectTypeOf<Result>().toHaveProperty("title");
    expectTypeOf<Result>().toHaveProperty("count");
  });

  test("should preserve resource structure from factory", () => {
    type Resource = { title: string; count: number };
    type Factory = ($: R$) => Resource;
    type Result = R<Factory>;
    expectTypeOf<Result>().toHaveProperty("title");
    expectTypeOf<Result>().toHaveProperty("count");
  });

  test("should preserve resource structure from async factory", () => {
    type Resource = { title: string; count: number };
    type Factory = ($: R$) => Promise<Resource>;
    type Result = R<Factory>;
    expectTypeOf<Result>().toHaveProperty("title");
    expectTypeOf<Result>().toHaveProperty("count");
  });

  test("should work with complex nested resource", () => {
    type NestedResource = {
      messages: {
        greeting: string;
        farewell: string;
      };
      buttons: {
        submit: string;
        cancel: string;
      };
    };
    type Result = R<NestedResource>;
    expectTypeOf<Result>().toHaveProperty("messages");
    expectTypeOf<Result>().toHaveProperty("buttons");
  });

  test("R type should extend AnyR", () => {
    type Resource = { greeting: string };
    type Result = R<Resource>;
    expectTypeOf<Result>().toExtend<AnyR>();
  });

  test("R from factory should extend AnyR", () => {
    type Resource = { greeting: string };
    type Factory = ($: R$) => Resource;
    type Result = R<Factory>;
    expectTypeOf<Result>().toExtend<AnyR>();
  });
});
