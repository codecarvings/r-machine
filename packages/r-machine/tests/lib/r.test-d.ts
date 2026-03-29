import { describe, expectTypeOf, it } from "vitest";
import type { AnyR, RShape } from "../../src/lib/r.js";
import type { RComposer } from "../../src/lib/r-composer.js";

describe("RShape", () => {
  it("should extract type from object forge", () => {
    type ResourceObject = { greeting: string; farewell: string };
    type Result = RShape<ResourceObject>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  it("should extract type from sync factory", () => {
    type ResourceObject = { greeting: string };
    type Factory = ($: any) => ResourceObject;
    type Result = RShape<Factory>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  it("should extract type from async factory", () => {
    type ResourceObject = { greeting: string };
    type AsyncFactory = ($: any) => Promise<ResourceObject>;
    type Result = RShape<AsyncFactory>;
    expectTypeOf<Result>().toExtend<ResourceObject>();
  });

  it("should preserve resource structure from object", () => {
    type Resource = { title: string; count: number };
    type Result = RShape<Resource>;
    expectTypeOf<Result>().toHaveProperty("title");
    expectTypeOf<Result>().toHaveProperty("count");
  });

  it("should preserve resource structure from factory", () => {
    type Resource = { title: string; count: number };
    type Factory = ($: any) => Resource;
    type Result = RShape<Factory>;
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
    type Result = RShape<NestedResource>;
    expectTypeOf<Result>().toHaveProperty("messages");
    expectTypeOf<Result>().toHaveProperty("buttons");
  });

  it("RShape type should extend AnyR", () => {
    type Resource = { greeting: string };
    type Result = RShape<Resource>;
    expectTypeOf<Result>().toExtend<AnyR>();
  });

  it("RShape from factory should extend AnyR", () => {
    type Resource = { greeting: string };
    type Factory = ($: any) => Resource;
    type Result = RShape<Factory>;
    expectTypeOf<Result>().toExtend<AnyR>();
  });
});

describe("RComposer interface", () => {
  type TestAtlas = {
    readonly common: { greeting: string };
    readonly nav: { home: string };
  };

  type TestKA = { readonly c: "common"; readonly n: "nav" };

  it("should have a define method", () => {
    type TestR = RComposer<TestAtlas, "en" | "it", TestKA>;
    expectTypeOf<TestR>().toHaveProperty("define");
  });

  it("define should accept a factory receiving RCtx", () => {
    type TestR = RComposer<TestAtlas, "en" | "it", TestKA>;
    type DefineParam = Parameters<TestR["define"]>[0];
    expectTypeOf<DefineParam>().toBeFunction();
  });

  it("factory parameter should receive locale and kit from RCtx", () => {
    type TestR = RComposer<TestAtlas, "en" | "it", TestKA>;
    type FactoryCtx = Parameters<Parameters<TestR["define"]>[0]>[0];
    expectTypeOf<FactoryCtx>().toHaveProperty("locale");
    expectTypeOf<FactoryCtx>().toHaveProperty("kit");
    expectTypeOf<FactoryCtx["locale"]>().toEqualTypeOf<"en" | "it">();
  });

  it("kit in factory context should resolve namespace aliases to resource types", () => {
    type TestR = RComposer<TestAtlas, "en" | "it", TestKA>;
    type FactoryCtx = Parameters<Parameters<TestR["define"]>[0]>[0];
    expectTypeOf<FactoryCtx["kit"]["c"]>().toEqualTypeOf<TestAtlas["common"]>();
    expectTypeOf<FactoryCtx["kit"]["n"]>().toEqualTypeOf<TestAtlas["nav"]>();
  });
});
