import { describe, expectTypeOf, it } from "vitest";
import type { AnyR } from "../../src/lib/r.js";
import type { AnyNamespace, AnyResourceAtlas, Namespace } from "../../src/lib/resource-atlas.js";

describe("AnyNamespace", () => {
  it("should be string type and accept string literals", () => {
    expectTypeOf<AnyNamespace>().toEqualTypeOf<string>();
    expectTypeOf<"my-namespace">().toExtend<AnyNamespace>();
  });
});

describe("AnyResourceAtlas", () => {
  it("should be an object type", () => {
    expectTypeOf<AnyResourceAtlas>().toBeObject();
  });

  it("should have index signature with AnyNamespace keys", () => {
    type AtlasValue = AnyResourceAtlas[string];
    expectTypeOf<AtlasValue>().toEqualTypeOf<AnyR>();
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
      common: () => ({ greeting: "Hello" }),
    };
    expectTypeOf(atlas).toExtend<AnyResourceAtlas>();
  });

  it("resource atlas with async factory should be assignable", () => {
    const atlas: AnyResourceAtlas = {
      common: async () => ({ greeting: "Hello" }),
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
