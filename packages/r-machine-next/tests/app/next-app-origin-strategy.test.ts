import { describe, expect, it, vi } from "vitest";
import { defaultPathMatcher } from "#r-machine/next/internal";
import { NextAppOriginStrategy } from "../../src/app/origin/next-app-origin-strategy.js";
import { DynamicPathAtlas, TranslatedPathAtlas } from "../_fixtures/_helpers.js";
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

// Structural helper: `config` and `rMachine` are protected — cast for assertions.
type ReadCfg = {
  localeOriginMap?: unknown;
  pathMatcher?: unknown;
  localeKey?: unknown;
  autoLocaleBinding?: unknown;
  basePath?: unknown;
  PathAtlas?: unknown;
};
const readConfig = (s: unknown): ReadCfg => (s as { config: ReadCfg }).config;
const readRMachine = (s: unknown): unknown => (s as { rMachine: unknown }).rMachine;

const minimalConfig = {
  localeOriginMap: {
    en: "https://en.example.com",
    it: "https://it.example.com",
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategy", () => {
  // -----------------------------------------------------------------------
  // create — the factory unique to this class (defaults merging)
  // -----------------------------------------------------------------------

  describe("create", () => {
    it("applies all defaults when called with minimal config (localeOriginMap only)", () => {
      const rMachine = createMockMachine();
      const strategy = NextAppOriginStrategy.create(rMachine, minimalConfig);

      expect(readRMachine(strategy)).toBe(rMachine);
      expect(readConfig(strategy).localeOriginMap).toBe(minimalConfig.localeOriginMap);
      expect(readConfig(strategy).pathMatcher).toBe(defaultPathMatcher);
      expect(readConfig(strategy).localeKey).toBe("locale");
      expect(readConfig(strategy).autoLocaleBinding).toBe("off");
      expect(readConfig(strategy).basePath).toBe("");
    });

    it("preserves non-overridden defaults when partial config is provided", () => {
      const rMachine = createMockMachine();
      const strategy = NextAppOriginStrategy.create(rMachine, {
        ...minimalConfig,
        basePath: "/docs",
      });

      expect(readConfig(strategy).basePath).toBe("/docs");
      expect(readConfig(strategy).localeOriginMap).toBe(minimalConfig.localeOriginMap);
      expect(readConfig(strategy).pathMatcher).toBe(defaultPathMatcher);
      expect(readConfig(strategy).localeKey).toBe("locale");
      expect(readConfig(strategy).autoLocaleBinding).toBe("off");
    });

    it("applies all overrides when full params are provided", () => {
      const rMachine = createMockMachine();
      const customMatcher = /^\/app\//;
      const strategy = NextAppOriginStrategy.create(rMachine, {
        ...minimalConfig,
        pathMatcher: customMatcher,
        localeKey: "lang",
        autoLocaleBinding: "on",
        basePath: "/app",
        PathAtlas: DynamicPathAtlas,
      });

      expect(readConfig(strategy).localeOriginMap).toBe(minimalConfig.localeOriginMap);
      expect(readConfig(strategy).pathMatcher).toBe(customMatcher);
      expect(readConfig(strategy).localeKey).toBe("lang");
      expect(readConfig(strategy).autoLocaleBinding).toBe("on");
      expect(readConfig(strategy).basePath).toBe("/app");
      expect(readConfig(strategy).PathAtlas).toBe(DynamicPathAtlas);
    });

    it("supports array values in localeOriginMap", () => {
      const rMachine = createMockMachine();
      const arrayOriginMap = {
        en: ["https://en.example.com", "https://en-alt.example.com"],
        it: "https://it.example.com",
      };
      const strategy = NextAppOriginStrategy.create(rMachine, {
        localeOriginMap: arrayOriginMap,
      });

      expect(readConfig(strategy).localeOriginMap).toBe(arrayOriginMap);
    });

    it("allows pathMatcher to be set to null", () => {
      const rMachine = createMockMachine();
      const strategy = NextAppOriginStrategy.create(rMachine, {
        ...minimalConfig,
        pathMatcher: null,
      });

      expect(readConfig(strategy).pathMatcher).toBeNull();
    });

    it("shallow-merges config: localeOriginMap replaces default entirely", () => {
      const rMachine = createMockMachine();
      const singleLocaleMap = { en: "https://en.example.com" };
      const strategy = NextAppOriginStrategy.create(rMachine, {
        localeOriginMap: singleLocaleMap,
      });

      expect(readConfig(strategy).localeOriginMap).toBe(singleLocaleMap);
      expect(Object.keys(readConfig(strategy).localeOriginMap as object)).toEqual(["en"]);
    });

    it("instantiates the PathAtlas provided in config", () => {
      const rMachine = createMockMachine();
      const strategy = NextAppOriginStrategy.create(rMachine, {
        ...minimalConfig,
        PathAtlas: TranslatedPathAtlas,
      });

      expect((strategy as any).hrefHelper.getPath("it", "/about")).toBe("/chi-siamo");
    });
  });

  // -----------------------------------------------------------------------
  // Integration — end-to-end with a translated PathAtlas
  // -----------------------------------------------------------------------

  describe("integration", () => {
    const rMachine = createMockMachine();
    const strategy = NextAppOriginStrategy.create(rMachine, {
      ...minimalConfig,
      PathAtlas: TranslatedPathAtlas,
    });

    it("getPath returns translated path for non-default locale", () => {
      expect((strategy as any).hrefHelper.getPath("it", "/about")).toBe("/chi-siamo");
    });

    it("getPath returns untranslated path for default locale", () => {
      expect((strategy as any).hrefHelper.getPath("en", "/about")).toBe("/about");
    });

    it("getUrl returns origin-prefixed translated path", () => {
      expect((strategy as any).hrefHelper.getUrl("it", "/about")).toBe("https://it.example.com/chi-siamo");
    });

    it("getUrl returns origin-prefixed untranslated path for default locale", () => {
      expect((strategy as any).hrefHelper.getUrl("en", "/about")).toBe("https://en.example.com/about");
    });

    it("getUrl interpolates dynamic params with origin for default locale", () => {
      expect((strategy as any).hrefHelper.getUrl("en", "/products/[id]", { id: "42" })).toBe(
        "https://en.example.com/products/42"
      );
    });

    it("getUrl interpolates dynamic params with origin and translation", () => {
      expect((strategy as any).hrefHelper.getUrl("it", "/products/[id]", { id: "42" })).toBe(
        "https://it.example.com/prodotti/42"
      );
    });
  });
});
