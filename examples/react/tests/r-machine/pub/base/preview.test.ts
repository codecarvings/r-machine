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

  it("mocks a DEEP sub-key of a res.perLocale dep, inheriting the real siblings", async () => {
    // Override just `views.intro.heading`: a DeepPartial deep-merged over the
    // real localized surface, so every un-mocked key (blurb, tagline, other
    // views) is inherited from the real shell.
    using ctrl = mockPlug(r).with({
      showcase: (locale) => ({ views: { intro: { heading: `mock-${locale}` } } }),
    });
    const preview = await ctrl.createRes();

    expect(preview.preview.en.views.intro.heading).toBe("mock-en"); // mocked leaf
    expect(preview.preview.it.views.intro.heading).toBe("mock-it");
    // Siblings survive the deep-merge — not wiped by the partial.
    expect(preview.preview.en.views.intro.blurb).toContain("no router"); // sibling key
    expect(preview.preview.en.views.outerGear.heading).toBe("OuterGear — reactive state"); // sibling view
    expect(preview.preview.en.tagline).toBe("A feature tour — no router required.");
  });
});
