import { describe, expectTypeOf, it } from "vitest";
import type { AnyR, R } from "../../src/lib/r.js";
import type { RCtx } from "../../src/lib/r-module.js";

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
