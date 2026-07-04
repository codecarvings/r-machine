import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  AnySegment,
  BoundPathComposer,
  BuiltPathAtlas,
  HrefCanonicalizer,
  HrefTranslator,
  PathAtlas,
  PathAtlasClass,
  PathCanonicalizer,
  PathParamMap,
  PathParams,
  PathSelector,
  RMachineProxy,
  Segment,
} from "../../src/core/index.js";
import { buildPathAtlas } from "../../src/core/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<HrefCanonicalizer>().toBeObject();

    expectTypeOf<HrefTranslator>().toBeObject();

    expectTypeOf(buildPathAtlas).toBeFunction();

    expectTypeOf<AnySegment>().toBeObject();

    expectTypeOf<AnyPathAtlas>().toBeObject();
    expectTypeOf<AnyPathAtlas>().toHaveProperty("segment");

    expectTypeOf<BoundPathComposer<AnyPathAtlas>>().toBeFunction();

    expectTypeOf<BuiltPathAtlas<AnyPathAtlas>>().toBeObject();

    expectTypeOf<PathAtlas<AnySegment>>().toBeObject();

    expectTypeOf<PathAtlasClass<AnyPathAtlas>>().toBeConstructibleWith();

    expectTypeOf<PathCanonicalizer>().toBeObject();

    expectTypeOf<PathParamMap<"/">>().toBeObject();

    expectTypeOf<PathParams<"/", PathParamMap<"/">>>().toBeObject();

    expectTypeOf<PathSelector<AnyPathAtlas>>().toExtend<string>();

    expectTypeOf<Segment<{}>>().toBeObject();

    expectTypeOf<RMachineProxy>().toBeFunction();
  });
});
