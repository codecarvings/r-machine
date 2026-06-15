import { describe, expectTypeOf, it } from "vitest";
import type { GatePluginCtx } from "../../src/core/gate-plug.js";
import type { LocaleAwarePluginCtx } from "../../src/core/plug.js";
import type { AnyResAtlas } from "../../src/core/res-atlas.js";

// gate-plug.ts is 100% type-level. The distinctive contract of a Gate (vs a
// plain locale-aware shell/res context) is the `setLocale` capability: a gate
// can switch the active locale, returning a Promise<void>.

describe("GatePluginCtx", () => {
  type Ctx = GatePluginCtx<AnyResAtlas, "en", {}>;

  it("is locale-aware (carries the active locale)", () => {
    expectTypeOf<Ctx["locale"]>().toEqualTypeOf<"en">();
    expectTypeOf<Ctx>().toExtend<LocaleAwarePluginCtx<AnyResAtlas, "en", {}>>();
  });

  it("adds the gate-only `setLocale(newLocale): Promise<void>` capability", () => {
    expectTypeOf<Ctx>().toHaveProperty("setLocale");
    expectTypeOf<Ctx["setLocale"]>().toEqualTypeOf<(newLocale: "en") => Promise<void>>();
  });

  it("a plain locale-aware context does NOT carry setLocale", () => {
    expectTypeOf<LocaleAwarePluginCtx<AnyResAtlas, "en", {}>>().not.toHaveProperty("setLocale");
  });
});
