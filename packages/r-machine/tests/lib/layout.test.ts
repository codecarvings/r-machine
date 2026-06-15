import { describe, expect, it } from "vitest";
import { createToken } from "#r-machine/core";
import { defineLayout } from "../../src/lib/layout.js";

// defineLayout builds the user-facing ResourceAtlas base class. The builder and
// makeClass paths are exercised throughout the suite via real atlases; here we
// pin the two static methods on the produced class.

const folders = defineLayout({
  "inner/": "gear:inner",
  "base/": "gear:base",
});

class Atlas extends folders<{ "inner/x": { v: number }; "base/y": { w: number } }>() {}

describe("defineLayout — produced ResourceAtlas class", () => {
  it("carries the declared layout", () => {
    expect(Atlas.layout).toEqual({ "inner/": "gear:inner", "base/": "gear:base" });
  });

  it("defaults to an empty priority list", () => {
    expect(Atlas.priority).toEqual([]);
  });

  it("getTokenBuilder returns the token factory", () => {
    expect((Atlas as unknown as { getTokenBuilder(): unknown }).getTokenBuilder()).toBe(createToken);
  });

  it("withPriority returns a sibling class carrying the priority (same layout)", () => {
    const Prioritized = (Atlas as unknown as { withPriority(p: readonly string[]): typeof Atlas }).withPriority([
      "base/y",
      "inner/x",
    ]);

    expect(Prioritized.priority).toEqual(["base/y", "inner/x"]);
    expect(Prioritized.layout).toEqual(Atlas.layout);
    // Original class is untouched.
    expect(Atlas.priority).toEqual([]);
  });
});
