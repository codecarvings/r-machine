import { describe, expectTypeOf, it } from "vitest";
import type { ListPlugin, MapPlugin, PluginCtx } from "../../src/core/plug.js";
import type { AnyResAtlas } from "../../src/core/res-atlas.js";

// The surface a `shell/lib/fmt` (mono) kit entry would expose to consumers.
interface Fmt {
  number: (n: number) => string;
  currency: (n: number) => string;
}

// The locale-aware plugin context built for a factory whose kit contains `fmt`.
// `kit.fmt` is the carrier behind the documented `$.kit.fmt` access.
interface KitCtx {
  readonly kit: { readonly fmt: Fmt };
  readonly locale: "en";
}

// Deps are empty in these assertions on purpose: `SurfaceMap<RA, {}>` and
// `SurfaceList<RA, []>` collapse to `{}`/`[]`, so the resulting plugin shape
// isolates exactly how the *kit* is distributed — which is what the docs
// promise. Real-dep surfaces are exercised elsewhere.

describe("PluginCtx — kit on the context", () => {
  it("exposes `kit` when the kit map is non-empty (this is `$.kit`)", () => {
    type Ctx = PluginCtx<AnyResAtlas, { readonly fmt: "shell/lib/fmt" }>;
    expectTypeOf<Ctx>().toHaveProperty("kit");
  });

  it("omits `kit` entirely when the kit map is empty", () => {
    expectTypeOf<PluginCtx<AnyResAtlas, {}>>().toEqualTypeOf<{}>();
  });
});

describe("ListPlugin — kit reachable only via `$` (not hoisted)", () => {
  type LP = ListPlugin<AnyResAtlas, [], KitCtx>;

  it("is a tuple whose last element is the context", () => {
    // With no deps the tuple is exactly `[ctx]` — `$` is the trailing element,
    // matching `define(([$]) => ...)` / `define(([dep, $]) => ...)`.
    expectTypeOf<LP>().toEqualTypeOf<[KitCtx]>();
  });

  it("types `$.kit.fmt` as the kit surface", () => {
    expectTypeOf<LP[0]["kit"]["fmt"]>().toEqualTypeOf<Fmt>();
  });

  it("does NOT hoist `fmt` as a tuple element (list form must go through `$`)", () => {
    // The only element is the context; there is no separate `fmt` slot and the
    // context itself does not carry the fmt members at top level.
    expectTypeOf<LP[0]>().not.toHaveProperty("fmt");
    expectTypeOf<LP[0]>().not.toHaveProperty("number");
  });
});

describe("MapPlugin — kit hoisted to top level AND reachable via `$`", () => {
  type MP = MapPlugin<AnyResAtlas, {}, KitCtx>;

  it("hoists `fmt` to the top level (map form: `define(({ fmt }) => ...)`)", () => {
    expectTypeOf<MP>().toHaveProperty("fmt");
    expectTypeOf<MP["fmt"]>().toEqualTypeOf<Fmt>();
  });

  it("also exposes the kit via `$` (`$.kit.fmt`)", () => {
    expectTypeOf<MP>().toHaveProperty("$");
    expectTypeOf<MP["$"]["kit"]["fmt"]>().toEqualTypeOf<Fmt>();
  });
});
