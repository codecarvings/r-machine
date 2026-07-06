import { mockPlug } from "@r-machine/testing";
import { describe, expect, it } from "vitest";
import { r } from "@/r-machine/pub/base/preview";

// base/preview is locale-agnostic: it declares shell/showcase as a
// `res.perLocale` dep (a locale loader) and resolves EVERY configured locale.
describe("Base_Preview", () => {
  it("reuses shell/showcase across every configured locale (resolved real)", async () => {
    using ctrl = mockPlug(r).default();
    const preview = await ctrl.createRes();

    expect(Object.keys(preview.preview)).toEqual(["en", "it"]);
    expect(preview.preview.en.tagline).toBe("A feature tour — no router required.");
    expect(preview.preview.it.tagline).toBe("Un tour delle feature — senza router.");
  });

  it("mocks a res.perLocale dep with a function, deep-merged over the real surface", async () => {
    using ctrl = mockPlug(r).with({ showcase: async (locale) => ({ tagline: `mock-${locale}` }) });
    const preview = await ctrl.createRes();

    // `tagline` comes from the mock; `appName` is inherited from the REAL surface.
    expect(preview.preview.en.tagline).toBe("mock-en");
    expect(preview.preview.en.appName).toBe("R-Machine × React");
  });
});
