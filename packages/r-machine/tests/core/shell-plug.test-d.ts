import { describe, expectTypeOf, it } from "vitest";
import type { ResAtlas } from "../../src/core/res-atlas.js";
import type { ShellPluginCtx, ShellPlugKitMap } from "../../src/core/shell-plug.js";

// shell-plug.ts is 100% type-level. Two contracts carry product weight:
//  1. a Shell context is locale-aware AND port-carrying (ResPluginCtx + locale);
//  2. a Shell may depend on shells AND base gears (the BGL widening) but not on
//     inner gears — the asymmetry that lets content reach shared base state.

type RL = {
  "s/": "shell";
  "b/": "gear:base";
  "i/": "gear:inner";
};
type RD = {
  "s/copy": { hi: string };
  "b/cfg": { url: string };
  "i/secret": { token: string };
};
type A = ResAtlas<RL, RD>;

describe("ShellPluginCtx", () => {
  it("carries the active locale", () => {
    expectTypeOf<ShellPluginCtx<A, "en", {}, {}>["locale"]>().toEqualTypeOf<"en">();
  });

  it("exposes declared ports via `$.ports.*` and omits `ports` when none are declared", () => {
    type WithPorts = ShellPluginCtx<A, "en", {}, { now: () => number }>;
    expectTypeOf<WithPorts>().toHaveProperty("ports");
    expectTypeOf<WithPorts["ports"]>().toEqualTypeOf<{ now: () => number }>();

    expectTypeOf<ShellPluginCtx<A, "en", {}, {}>>().not.toHaveProperty("ports");
  });
});

describe("ShellPlugKitMap — allowed dependency namespaces", () => {
  it("allows shell + base-gear namespaces (BGL widening), excluding inner gears", () => {
    // The kit-map value type IS the set of namespaces a shell may bind to.
    type Allowed = ShellPlugKitMap<A, ["b/cfg"]>[string];

    expectTypeOf<Allowed>().toEqualTypeOf<"s/copy" | "b/cfg">();
    // Inner-gear namespaces are never part of the allowed set.
    expectTypeOf<"i/secret">().not.toExtend<Allowed>();
  });
});
