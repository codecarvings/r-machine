import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  AnyPathAtlasProvider,
  AnyPathAtlasProviderCtor,
  BoundPathComposer,
  ExtendedPathAtlasProvider,
  HrefCanonicalizer,
  HrefMapper,
  HrefTranslator,
  NonTranslatableSegmentDecl,
  PathAtlasProvider,
  PathAtlasProviderCtor,
  PathParamMap,
  PathParams,
  PathSelector,
  RMachineProxy,
  TranslatableSegmentDecl,
} from "../../src/core/index.js";
import { buildPathAtlas } from "../../src/core/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<HrefCanonicalizer>().toBeObject();

    expectTypeOf<HrefMapper<any>>().toBeObject();

    expectTypeOf<HrefTranslator>().toBeObject();

    expectTypeOf(buildPathAtlas).toBeFunction();

    expectTypeOf<AnyPathAtlas>().toBeObject();

    expectTypeOf<AnyPathAtlasProvider>().toBeObject();
    expectTypeOf<AnyPathAtlasProvider>().toHaveProperty("decl");

    expectTypeOf<BoundPathComposer<AnyPathAtlasProvider>>().toBeFunction();

    expectTypeOf<ExtendedPathAtlasProvider<AnyPathAtlasProvider>>().toBeObject();

    expectTypeOf<AnyPathAtlasProviderCtor>().toBeConstructibleWith();

    expectTypeOf<PathAtlasProvider<AnyPathAtlas>>().toBeObject();

    expectTypeOf<PathAtlasProviderCtor<AnyPathAtlasProvider>>().toBeConstructibleWith();

    expectTypeOf<PathParamMap<"/">>().toBeObject();

    expectTypeOf<PathParams<"/", PathParamMap<"/">>>().toBeObject();

    expectTypeOf<PathSelector<AnyPathAtlasProvider>>().toExtend<string>();

    expectTypeOf<NonTranslatableSegmentDecl<{}>>().toBeObject();

    expectTypeOf<TranslatableSegmentDecl<{}>>().toBeObject();

    expectTypeOf<RMachineProxy>().toBeFunction();
  });
});
