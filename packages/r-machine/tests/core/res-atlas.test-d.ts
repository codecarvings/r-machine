import { describe, expectTypeOf, it } from "vitest";
import type { RMachineTypeError } from "#r-machine/errors";
import type { IsInternalNamespace, ResAtlas, ResAtlasClass } from "../../src/core/res-atlas.js";
import type { TokenBuilder } from "../../src/core/res-domain.js";

// res-atlas.ts is 100% type-level (no runtime), so this is its only test. It
// pins the two behaviours that actually carry product weight: the internal-
// namespace ("#") hiding on consumer-facing surfaces, and the compile-time
// diagnostic that turns getTokenBuilder into a branded error when the atlas
// shape is malformed.

describe("IsInternalNamespace", () => {
  it("is true only for a leading-# namespace", () => {
    expectTypeOf<IsInternalNamespace<"#base/jwt">>().toEqualTypeOf<true>();
    expectTypeOf<IsInternalNamespace<"base/jwt">>().toEqualTypeOf<false>();
  });
});

describe("ResAtlas shape/valid maps", () => {
  type RL = {
    "inner/": "gear:inner";
    "outer/": "gear:outer";
    "shell/": "shell";
  };
  // "#inner/secret" is an internal namespace classified as gear:inner — the
  // leading "#" must not change its layout classification.
  type RD = {
    "inner/pub": unknown;
    "#inner/secret": unknown;
    "outer/clock": unknown;
    "shell/copy": unknown;
  };
  type A = ResAtlas<RL, RD>;

  it("filters by layout type — shape@gear:outer keeps only outer-gear namespaces", () => {
    expectTypeOf<keyof A["shape@gear:outer"]>().toEqualTypeOf<"outer/clock">();
  });

  it("keeps internal (#) namespaces on the gear→gear dependency surface", () => {
    expectTypeOf<keyof A["valid@gear:inner"]>().toEqualTypeOf<"inner/pub" | "#inner/secret">();
  });

  it("hides internal (#) namespaces from the consumer-facing valid@server surface", () => {
    expectTypeOf<keyof A["valid@server"]>().toEqualTypeOf<"inner/pub" | "shell/copy">();
  });
});

describe("ResAtlasClass — getTokenBuilder diagnostic", () => {
  type RL = { "g/": "gear:inner" };
  type RD = { "g/ok": unknown };

  it("is a callable TokenBuilder factory when the atlas shape is valid", () => {
    expectTypeOf<ResAtlasClass<RL, RD, RD>["getTokenBuilder"]>().toEqualTypeOf<() => TokenBuilder<RD>>();
  });

  it("becomes a branded error (not callable) when a key uses a reserved character", () => {
    type RAReserved = RD & { "g/bad:key": unknown };
    expectTypeOf<ResAtlasClass<RL, RD, RAReserved>["getTokenBuilder"]>().toExtend<RMachineTypeError<string>>();
  });

  it("becomes a branded error when a raw key was dropped by the layout filter", () => {
    type RADropped = RD & { "ghost/x": unknown };
    expectTypeOf<ResAtlasClass<RL, RD, RADropped>["getTokenBuilder"]>().toExtend<RMachineTypeError<string>>();
  });
});
