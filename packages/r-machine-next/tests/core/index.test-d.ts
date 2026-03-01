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
} from "../../src/core/index.js";
import { buildPathAtlas } from "../../src/core/index.js";

describe("core barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<HrefCanonicalizer>().toBeObject();

    expectTypeOf<HrefMapper<any>>().toBeObject();

    expectTypeOf<HrefTranslator>().toBeObject();

    expectTypeOf(buildPathAtlas).toBeFunction();

    expectTypeOf<AnyPathAtlas>().toBeObject();
    expectTypeOf<AnyPathAtlas>().toHaveProperty("decl");

    expectTypeOf<BoundPathComposer<AnyPathAtlas>>().toBeFunction();

    expectTypeOf<ExtendedPathAtlas<AnyPathAtlas>>().toBeObject();

    expectTypeOf<PathAtlasCtor<AnyPathAtlas>>().toBeConstructibleWith();

    expectTypeOf<PathParamMap<"/">>().toBeObject();

    expectTypeOf<PathParams<"/", PathParamMap<"/">>>().toBeObject();

    expectTypeOf<PathSelector<AnyPathAtlas>>().toExtend<string>();

    expectTypeOf<NonTranslatableSegmentDecl<{}>>().toBeObject();

    expectTypeOf<TranslatableSegmentDecl<{}>>().toBeObject();

    expectTypeOf<RMachineProxy>().toBeFunction();
  });
});
