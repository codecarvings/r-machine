import { describe, expectTypeOf, it } from "vitest";
import type { AnyNamespace, AnyR, AnyResourceAtlas, Namespace, R } from "../../src/lib/r.js";
import type { AnyRForge, RCtx } from "../../src/lib/r-module.js";

describe("AnyNamespace", () => {
  it("should be string type", () => {
    expectTypeOf<AnyNamespace>().toEqualTypeOf<string>();
  });

  it("string should be assignable to AnyNamespace", () => {
    expectTypeOf<string>().toExtend<AnyNamespace>();
  });

  it("string literal should be assignable to AnyNamespace", () => {
    expectTypeOf<"my-namespace">().toExtend<AnyNamespace>();
  });
});

describe("AnyR", () => {
  it("should be object type", () => {
    expectTypeOf<AnyR>().toEqualTypeOf<object>();
  });

  it("object should be assignable to AnyR", () => {
    expectTypeOf<object>().toExtend<AnyR>();
  });

  it("record type should be assignable to AnyR", () => {
    expectTypeOf<{ key: string }>().toExtend<AnyR>();
  });

  it("null should not be assignable to AnyR", () => {
    expectTypeOf<null>().not.toExtend<AnyR>();
  });

  it("undefined should not be assignable to AnyR", () => {
    expectTypeOf<undefined>().not.toExtend<AnyR>();
  });

  it("primitive types should not be assignable to AnyR", () => {
    expectTypeOf<string>().not.toExtend<AnyR>();
    expectTypeOf<number>().not.toExtend<AnyR>();
    expectTypeOf<boolean>().not.toExtend<AnyR>();
  });
});

describe("AnyResourceAtlas", () => {
  it("should be an object type", () => {
    expectTypeOf<AnyResourceAtlas>().toBeObject();
  });

  it("should have index signature with AnyNamespace keys", () => {
    type AtlasValue = AnyResourceAtlas[string];
    expectTypeOf<AtlasValue>().toEqualTypeOf<AnyRForge>();
  });

  it("valid resource atlas should be assignable", () => {
    const atlas: AnyResourceAtlas = {
      common: { greeting: "Hello" },
      home: { title: "Welcome" },
    };
    expectTypeOf(atlas).toExtend<AnyResourceAtlas>();
  });

  it("resource atlas with factory should be assignable", () => {
    const atlas: AnyResourceAtlas = {
      common: ($: RCtx) => ({ greeting: `Hello from ${$.locale}` }),
    };
    expectTypeOf(atlas).toExtend<AnyResourceAtlas>();
  });

  it("resource atlas with async factory should be assignable", () => {
    const atlas: AnyResourceAtlas = {
      common: async ($: RCtx) => ({ greeting: `Hello from ${$.locale}` }),
    };
    expectTypeOf(atlas).toExtend<AnyResourceAtlas>();
  });
});

describe("Namespace", () => {
  it("should extract string keys from ResourceAtlas", () => {
    type TestAtlas = {
      readonly common: { greeting: string };
      readonly home: { title: string };
    };
    expectTypeOf<Namespace<TestAtlas>>().toEqualTypeOf<"common" | "home">();
  });

  it("should work with single namespace", () => {
    type TestAtlas = {
      readonly common: { greeting: string };
    };
    expectTypeOf<Namespace<TestAtlas>>().toEqualTypeOf<"common">();
  });

  it("should be assignable to AnyNamespace", () => {
    type TestAtlas = {
      readonly common: { greeting: string };
    };
    expectTypeOf<Namespace<TestAtlas>>().toExtend<AnyNamespace>();
  });

  it("should extract only string keys", () => {
    type TestAtlas = {
      readonly common: { greeting: string };
      readonly home: { title: string };
    };
    type NS = Namespace<TestAtlas>;
    expectTypeOf<NS>().toExtend<string>();
  });
});

describe("R", () => {
  it("should extract type from object forge", () => {
    type ResourceObject = { greeting: string; farewell: string };
    type Result = R<ResourceObject>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  it("should extract type from sync factory", () => {
    type ResourceObject = { greeting: string };
    type Factory = ($: RCtx) => ResourceObject;
    type Result = R<Factory>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  it("should extract type from async factory", () => {
    type ResourceObject = { greeting: string };
    type AsyncFactory = ($: RCtx) => Promise<ResourceObject>;
    type Result = R<AsyncFactory>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  it("should preserve resource structure from object", () => {
    type Resource = { title: string; count: number };
    type Result = R<Resource>;
    expectTypeOf<Result>().toHaveProperty("title");
    expectTypeOf<Result>().toHaveProperty("count");
  });

  it("should preserve resource structure from factory", () => {
    type Resource = { title: string; count: number };
    type Factory = ($: RCtx) => Resource;
    type Result = R<Factory>;
    expectTypeOf<Result>().toHaveProperty("title");
    expectTypeOf<Result>().toHaveProperty("count");
  });

  it("should preserve resource structure from async factory", () => {
    type Resource = { title: string; count: number };
    type Factory = ($: RCtx) => Promise<Resource>;
    type Result = R<Factory>;
    expectTypeOf<Result>().toHaveProperty("title");
    expectTypeOf<Result>().toHaveProperty("count");
  });

  it("should work with complex nested resource", () => {
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

  it("R type should extend AnyR", () => {
    type Resource = { greeting: string };
    type Result = R<Resource>;
    expectTypeOf<Result>().toExtend<AnyR>();
  });

  it("R from factory should extend AnyR", () => {
    type Resource = { greeting: string };
    type Factory = ($: RCtx) => Resource;
    type Result = R<Factory>;
    expectTypeOf<Result>().toExtend<AnyR>();
  });
});
