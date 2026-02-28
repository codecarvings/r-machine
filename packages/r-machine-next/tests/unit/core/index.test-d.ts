import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  BoundPathComposer,
  ExtendedPathAtlas,
  HrefCanonicalizer,
  HrefMapper,
  HrefTranslator,
  NonTranslatableSegmentDecl,
  PathAtlasCtor,
  PathParamMap,
  PathParams,
  PathSelector,
  RMachineProxy,
  TranslatableSegmentDecl,
} from "../../../src/core/index.js";
import { buildPathAtlas } from "../../../src/core/index.js";

describe("core barrel exports", () => {
  it("should export HrefCanonicalizer as a class", () => {
    expectTypeOf<HrefCanonicalizer>().toBeObject();
  });

  it("should export HrefMapper as a class", () => {
    expectTypeOf<HrefMapper<any>>().toBeObject();
  });

  it("should export HrefTranslator as a class", () => {
    expectTypeOf<HrefTranslator>().toBeObject();
  });

  it("should export buildPathAtlas as a function", () => {
    expectTypeOf(buildPathAtlas).toBeFunction();
  });

  it("should export AnyPathAtlas as an object type", () => {
    expectTypeOf<AnyPathAtlas>().toBeObject();
    expectTypeOf<AnyPathAtlas>().toHaveProperty("decl");
  });

  it("should export BoundPathComposer as a function type", () => {
    expectTypeOf<BoundPathComposer<AnyPathAtlas>>().toBeFunction();
  });

  it("should export ExtendedPathAtlas as an object type", () => {
    expectTypeOf<ExtendedPathAtlas<AnyPathAtlas>>().toBeObject();
  });

  it("should export PathAtlasCtor as a constructor type", () => {
    expectTypeOf<PathAtlasCtor<AnyPathAtlas>>().toBeConstructibleWith();
  });

  it("should export PathParamMap as a type", () => {
    expectTypeOf<PathParamMap<"/">>().toBeObject();
  });

  it("should export PathParams as a type", () => {
    expectTypeOf<PathParams<"/", PathParamMap<"/">>>().toBeObject();
  });

  it("should export PathSelector as a string type", () => {
    expectTypeOf<PathSelector<AnyPathAtlas>>().toExtend<string>();
  });

  it("should export NonTranslatableSegmentDecl as an object type", () => {
    expectTypeOf<NonTranslatableSegmentDecl<{}>>().toBeObject();
  });

  it("should export TranslatableSegmentDecl as an object type", () => {
    expectTypeOf<TranslatableSegmentDecl<{}>>().toBeObject();
  });

  it("should export RMachineProxy as a function type", () => {
    expectTypeOf<RMachineProxy>().toBeFunction();
  });
});
