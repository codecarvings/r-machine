import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  AnyPathAtlasDeclaration,
  AnyPathAtlasDeclarationCtor,
  BoundPathComposer,
  BuiltPathAtlasDeclaration,
  HrefCanonicalizer,
  HrefMapper,
  HrefTranslator,
  NonTranslatableSegmentDecl,
  PathAtlasDeclaration,
  PathAtlasDeclarationCtor,
  PathParamMap,
  PathParams,
  PathSelector,
  RMachineProxy,
  TranslatableSegmentDecl,
} from "../../src/core/index.js";
import { buildPathAtlasDeclaration } from "../../src/core/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<HrefCanonicalizer>().toBeObject();

    expectTypeOf<HrefMapper<any>>().toBeObject();

    expectTypeOf<HrefTranslator>().toBeObject();

    expectTypeOf(buildPathAtlasDeclaration).toBeFunction();

    expectTypeOf<AnyPathAtlas>().toBeObject();

    expectTypeOf<AnyPathAtlasDeclaration>().toBeObject();
    expectTypeOf<AnyPathAtlasDeclaration>().toHaveProperty("decl");

    expectTypeOf<BoundPathComposer<AnyPathAtlasDeclaration>>().toBeFunction();

    expectTypeOf<BuiltPathAtlasDeclaration<AnyPathAtlasDeclaration>>().toBeObject();

    expectTypeOf<AnyPathAtlasDeclarationCtor>().toBeConstructibleWith();

    expectTypeOf<PathAtlasDeclaration<AnyPathAtlas>>().toBeObject();

    expectTypeOf<PathAtlasDeclarationCtor<AnyPathAtlasDeclaration>>().toBeConstructibleWith();

    expectTypeOf<PathParamMap<"/">>().toBeObject();

    expectTypeOf<PathParams<"/", PathParamMap<"/">>>().toBeObject();

    expectTypeOf<PathSelector<AnyPathAtlasDeclaration>>().toExtend<string>();

    expectTypeOf<NonTranslatableSegmentDecl<{}>>().toBeObject();

    expectTypeOf<TranslatableSegmentDecl<{}>>().toBeObject();

    expectTypeOf<RMachineProxy>().toBeFunction();
  });
});
