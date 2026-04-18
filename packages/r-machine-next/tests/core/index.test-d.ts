import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  AnyPathAtlasClass,
  AnySegment,
  BoundPathComposer,
  BuiltPathAtlas,
  HrefCanonicalizer,
  HrefMapper,
  HrefTranslator,
  PathAtlas,
  PathAtlasClass,
  PathParamMap,
  PathParams,
  PathSelector,
  RMachineProxy,
  Segment,
  TranslatableSegment,
} from "../../src/core/index.js";
import { buildPathAtlas } from "../../src/core/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<HrefCanonicalizer>().toBeObject();

    expectTypeOf<HrefMapper<any>>().toBeObject();

    expectTypeOf<HrefTranslator>().toBeObject();

    expectTypeOf(buildPathAtlas).toBeFunction();

    expectTypeOf<AnySegment>().toBeObject();

    expectTypeOf<AnyPathAtlas>().toBeObject();
    expectTypeOf<AnyPathAtlas>().toHaveProperty("segment");

    expectTypeOf<BoundPathComposer<AnyPathAtlas>>().toBeFunction();

    expectTypeOf<BuiltPathAtlas<AnyPathAtlas>>().toBeObject();

    expectTypeOf<AnyPathAtlasClass>().toBeConstructibleWith();

    expectTypeOf<PathAtlas<AnySegment>>().toBeObject();

    expectTypeOf<PathAtlasClass<AnyPathAtlas>>().toBeConstructibleWith();

    expectTypeOf<PathParamMap<"/">>().toBeObject();

    expectTypeOf<PathParams<"/", PathParamMap<"/">>>().toBeObject();

    expectTypeOf<PathSelector<AnyPathAtlas>>().toExtend<string>();

    expectTypeOf<Segment<{}>>().toBeObject();

    expectTypeOf<TranslatableSegment<{}>>().toBeObject();

    expectTypeOf<RMachineProxy>().toBeFunction();
  });
});
