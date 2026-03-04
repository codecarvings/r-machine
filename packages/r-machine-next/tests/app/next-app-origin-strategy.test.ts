import { describe, expect, it, vi } from "vitest";
import { defaultPathMatcher } from "#r-machine/next/internal";
import { NextAppOriginStrategy } from "../../src/app/next-app-origin-strategy.js";
import { DynamicPathAtlas } from "../_fixtures/_helpers.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// Mocks — external deps required by dynamically imported modules
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { rewrite: vi.fn(), next: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const minimalConfig = {
  localeOriginMap: {
    en: "https://en.example.com",
    it: "https://it.example.com",
  },
};

class TranslatedPathAtlas {
  readonly decl = {
    "/about": { it: "/chi-siamo" },
    "/products": { it: "/prodotti", "/[id]": {} },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategy", () => {
  // -----------------------------------------------------------------------
  // Constructor — the only logic unique to this class (defaults merging)
  // -----------------------------------------------------------------------

  describe("constructor", () => {
    it("applies all defaults when called with minimal config (localeOriginMap only)", () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppOriginStrategy(rMachine, minimalConfig);

      expect(strategy.rMachine).toBe(rMachine);
      expect(strategy.config.localeOriginMap).toBe(minimalConfig.localeOriginMap);
      expect(strategy.config.pathMatcher).toBe(defaultPathMatcher);
      expect(strategy.config.localeKey).toBe("locale");
      expect(strategy.config.autoLocaleBinding).toBe("off");
      expect(strategy.config.basePath).toBe("");
    });

    it("preserves non-overridden defaults when partial config is provided", () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppOriginStrategy(rMachine, {
        ...minimalConfig,
        basePath: "/docs",
      });

      expect(strategy.config.basePath).toBe("/docs");
      expect(strategy.config.localeOriginMap).toBe(minimalConfig.localeOriginMap);
      expect(strategy.config.pathMatcher).toBe(defaultPathMatcher);
      expect(strategy.config.localeKey).toBe("locale");
      expect(strategy.config.autoLocaleBinding).toBe("off");
    });

    it("applies all overrides when full config is provided", () => {
      const rMachine = createMockMachine();
      const customMatcher = /^\/app\//;
      const strategy = new NextAppOriginStrategy(rMachine, {
        ...minimalConfig,
        pathMatcher: customMatcher,
        localeKey: "lang",
        autoLocaleBinding: "on",
        basePath: "/app",
        PathAtlas: DynamicPathAtlas,
      });

      expect(strategy.config.localeOriginMap).toBe(minimalConfig.localeOriginMap);
      expect(strategy.config.pathMatcher).toBe(customMatcher);
      expect(strategy.config.localeKey).toBe("lang");
      expect(strategy.config.autoLocaleBinding).toBe("on");
      expect(strategy.config.basePath).toBe("/app");
      expect(strategy.config.PathAtlas).toBe(DynamicPathAtlas);
    });

    it("supports array values in localeOriginMap", () => {
      const rMachine = createMockMachine();
      const arrayOriginMap = {
        en: ["https://en.example.com", "https://en-alt.example.com"],
        it: "https://it.example.com",
      };
      const strategy = new NextAppOriginStrategy(rMachine, {
        localeOriginMap: arrayOriginMap,
      });

      expect(strategy.config.localeOriginMap).toBe(arrayOriginMap);
    });

    it("allows pathMatcher to be set to null", () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppOriginStrategy(rMachine, {
        ...minimalConfig,
        pathMatcher: null,
      });

      expect(strategy.config.pathMatcher).toBeNull();
    });

    it("shallow-merges config: localeOriginMap replaces default entirely", () => {
      const rMachine = createMockMachine();
      const singleLocaleMap = { en: "https://en.example.com" };
      const strategy = new NextAppOriginStrategy(rMachine, {
        localeOriginMap: singleLocaleMap,
      });

      expect(strategy.config.localeOriginMap).toBe(singleLocaleMap);
      expect(Object.keys(strategy.config.localeOriginMap)).toEqual(["en"]);
    });

    it("explicit undefined in config overrides defaults (shallow spread behavior)", () => {
      const rMachine = createMockMachine();
      const configWithUndefined = {
        ...minimalConfig,
        pathMatcher: undefined as undefined,
      };
      // @ts-expect-error — exactOptionalPropertyTypes prevents undefined, but we test runtime spread behavior
      const strategy = new NextAppOriginStrategy(rMachine, configWithUndefined);

      expect(strategy.config.pathMatcher).toBeUndefined();
    });

    it("instantiates the PathAtlas provided in config", () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppOriginStrategy(rMachine, {
        ...minimalConfig,
        PathAtlas: TranslatedPathAtlas,
      });

      expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/chi-siamo");
    });
  });

  // -----------------------------------------------------------------------
  // Integration — end-to-end with a translated PathAtlas
  // -----------------------------------------------------------------------

  describe("integration", () => {
    const rMachine = createMockMachine();
    const strategy = new NextAppOriginStrategy(rMachine, {
      ...minimalConfig,
      PathAtlas: TranslatedPathAtlas,
    });

    it("getPath returns translated path for non-default locale", () => {
      expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/chi-siamo");
    });

    it("getPath returns untranslated path for default locale", () => {
      expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/about");
    });

    it("getUrl returns origin-prefixed translated path", () => {
      expect(strategy.hrefHelper.getUrl("it", "/about")).toBe("https://it.example.com/chi-siamo");
    });

    it("getUrl returns origin-prefixed untranslated path for default locale", () => {
      expect(strategy.hrefHelper.getUrl("en", "/about")).toBe("https://en.example.com/about");
    });

    it("getUrl interpolates dynamic params with origin for default locale", () => {
      expect(strategy.hrefHelper.getUrl("en", "/products/[id]", { id: "42" })).toBe(
        "https://en.example.com/products/42"
      );
    });

    it("getUrl interpolates dynamic params with origin and translation", () => {
      expect(strategy.hrefHelper.getUrl("it", "/products/[id]", { id: "42" })).toBe(
        "https://it.example.com/prodotti/42"
      );
    });
  });
});
