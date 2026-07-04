import { describe, expectTypeOf, it } from "vitest";
import type { HrefCanonicalizer } from "../../src/core/href-canonicalizer.js";
import type { AnyPathAtlas } from "../../src/core/path-atlas.js";
import { PathCanonicalizer } from "../../src/core/path-canonicalizer.js";

describe("PathCanonicalizer", () => {
  it("is constructible with (AnyPathAtlas, readonly string[], string, boolean)", () => {
    expectTypeOf(PathCanonicalizer).toBeConstructibleWith({} as AnyPathAtlas, ["en", "it"] as const, "en", false);
  });

  it("extends HrefCanonicalizer", () => {
    expectTypeOf<PathCanonicalizer>().toExtend<HrefCanonicalizer>();
  });
});
