import { RMachineConfigError } from "r-machine/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { NextAppStrategyCore } from "#r-machine/next/core/app";
import { defaultPathMatcher } from "#r-machine/next/internal";
import {
  type NextAppOriginStrategyConfig,
  NextAppOriginStrategyCore,
  NextAppOriginStrategyUrlTranslator,
} from "../../../../src/core/app/origin/next-app-origin-strategy-core.js";
import {
  aboutAtlas,
  createMockAtlas,
  productsAtlas,
  SimplePathAtlas,
  TranslatedPathAtlas,
} from "../../../_fixtures/_helpers.js";
import { createMockMachine, type TestAtlas } from "../../../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreateClientImpl = vi.fn();
const mockCreateServerImpl = vi.fn();

vi.mock("../../../../src/core/app/origin/next-app-origin.client-impl.js", () => ({
  createNextAppOriginClientImpl: (...args: unknown[]) => mockCreateClientImpl(...args),
}));

vi.mock("../../../../src/core/app/origin/next-app-origin.server-impl.js", () => ({
  createNextAppOriginServerImpl: (...args: unknown[]) => mockCreateServerImpl(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SimpleConfig = NextAppOriginStrategyConfig<SimplePathAtlas, "locale">;
type TranslatedConfig = NextAppOriginStrategyConfig<TranslatedPathAtlas, "locale">;

function createTestConfig(overrides?: Partial<SimpleConfig>): SimpleConfig {
  return {
    ...NextAppOriginStrategyCore.defaultConfig,
    PathAtlas: SimplePathAtlas,
    localeOriginMap: { en: "https://en.example.com", it: "https://it.example.com" },
    ...overrides,
  } as SimpleConfig;
}

function createTestStrategy(configOverrides?: Partial<SimpleConfig>) {
  const config = createTestConfig(configOverrides);

  class TestOriginStrategy extends NextAppOriginStrategyCore<TestAtlas, SimpleConfig> {}

  const rMachine = createMockMachine();
  const strategy = new TestOriginStrategy(rMachine, config);

  return { strategy, rMachine, config };
}

function createTranslatedStrategy(
  localeOriginMap: Record<string, string | string[]> = {
    en: "https://en.example.com",
    it: "https://it.example.com",
  }
) {
  const config: TranslatedConfig = {
    PathAtlas: TranslatedPathAtlas,
    localeKey: "locale",
    autoLocaleBinding: "off",
    basePath: "",
    localeOriginMap,
    pathMatcher: defaultPathMatcher,
  } as TranslatedConfig;

  class TestOriginStrategy extends NextAppOriginStrategyCore<TestAtlas, TranslatedConfig> {}

  const rMachine = createMockMachine();
  return new TestOriginStrategy(rMachine, config);
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategyCore", () => {
  describe("defaultConfig", () => {
    it("extends NextAppStrategyCore.defaultConfig", () => {
      const config = NextAppOriginStrategyCore.defaultConfig;
      expect(config.PathAtlas).toBe(NextAppStrategyCore.defaultConfig.PathAtlas);
      expect(config.localeKey).toBe(NextAppStrategyCore.defaultConfig.localeKey);
      expect(config.autoLocaleBinding).toBe(NextAppStrategyCore.defaultConfig.autoLocaleBinding);
      expect(config.basePath).toBe(NextAppStrategyCore.defaultConfig.basePath);
    });

    it("has localeOriginMap set to empty object", () => {
      expect(NextAppOriginStrategyCore.defaultConfig.localeOriginMap).toEqual({});
    });

    it("has pathMatcher set to defaultPathMatcher", () => {
      expect(NextAppOriginStrategyCore.defaultConfig.pathMatcher).toBe(defaultPathMatcher);
    });
  });

  describe("protected members initialization", () => {
    it("creates pathAtlas from config.PathAtlas", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathAtlas).toBeDefined();
      expect((strategy as any).pathAtlas.decl).toEqual({});
    });

    it("creates pathTranslator as HrefTranslator", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathTranslator).toBeInstanceOf(HrefTranslator);
    });

    it("creates urlTranslator as NextAppOriginStrategyUrlTranslator", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).urlTranslator).toBeInstanceOf(NextAppOriginStrategyUrlTranslator);
    });

    it("creates pathCanonicalizer as HrefCanonicalizer", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathCanonicalizer).toBeInstanceOf(HrefCanonicalizer);
    });
  });

  // -----------------------------------------------------------------------
  // createClientImpl
  // -----------------------------------------------------------------------

  describe("createClientImpl", () => {
    it("delegates to createNextAppOriginClientImpl with correct args", async () => {
      const { strategy, rMachine, config } = createTestStrategy();
      const expectedResult = { onLoad: undefined, writeLocale: vi.fn(), createUsePathComposer: vi.fn() };
      mockCreateClientImpl.mockReturnValue(expectedResult);

      const result = await (strategy as any).createClientImpl();

      expect(mockCreateClientImpl).toHaveBeenCalledOnce();
      expect(mockCreateClientImpl).toHaveBeenCalledWith(
        rMachine,
        config,
        (strategy as any).pathTranslator,
        (strategy as any).urlTranslator,
        (strategy as any).pathCanonicalizer
      );
      expect(result).toBe(expectedResult);
    });
  });

  // -----------------------------------------------------------------------
  // createServerImpl
  // -----------------------------------------------------------------------

  describe("createServerImpl", () => {
    it("delegates to createNextAppOriginServerImpl with correct args", async () => {
      const { strategy, rMachine, config } = createTestStrategy();
      const expectedResult = { localeKey: "locale" };
      mockCreateServerImpl.mockReturnValue(expectedResult);

      const result = await (strategy as any).createServerImpl();

      expect(mockCreateServerImpl).toHaveBeenCalledOnce();
      expect(mockCreateServerImpl).toHaveBeenCalledWith(
        rMachine,
        config,
        (strategy as any).pathTranslator,
        (strategy as any).urlTranslator,
        (strategy as any).pathCanonicalizer
      );
      expect(result).toBe(expectedResult);
    });
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("has getPath and getUrl functions", () => {
      const { strategy } = createTestStrategy();
      expect(typeof strategy.hrefHelper.getPath).toBe("function");
      expect(typeof strategy.hrefHelper.getUrl).toBe("function");
    });

    describe("getPath", () => {
      it("delegates to pathTranslator.get and returns value", () => {
        const strategy = createTranslatedStrategy();

        expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/about");
        expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/chi-siamo");
      });

      it("passes params to pathTranslator.get", () => {
        const strategy = createTranslatedStrategy();

        expect(strategy.hrefHelper.getPath("en", "/products/[id]", { id: "42" })).toBe("/products/42");
        expect(strategy.hrefHelper.getPath("it", "/products/[id]", { id: "42" })).toBe("/prodotti/42");
      });
    });

    describe("getUrl", () => {
      it("delegates to urlTranslator.get and returns origin-prefixed value", () => {
        const strategy = createTranslatedStrategy();

        expect(strategy.hrefHelper.getUrl("en", "/about")).toBe("https://en.example.com/about");
        expect(strategy.hrefHelper.getUrl("it", "/about")).toBe("https://it.example.com/chi-siamo");
      });

      it("passes params to urlTranslator.get", () => {
        const strategy = createTranslatedStrategy();

        expect(strategy.hrefHelper.getUrl("en", "/products/[id]", { id: "42" })).toBe(
          "https://en.example.com/products/42"
        );
        expect(strategy.hrefHelper.getUrl("it", "/products/[id]", { id: "42" })).toBe(
          "https://it.example.com/prodotti/42"
        );
      });
    });
  });
});

describe("NextAppOriginStrategyUrlTranslator", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  describe("constructor", () => {
    it("populates origin cache from string values", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(createMockAtlas(), locales, defaultLocale, {
        en: "https://en.example.com",
        it: "https://it.example.com",
      });

      expect((translator as any).localeOriginMapCache.get("en")).toBe("https://en.example.com");
      expect((translator as any).localeOriginMapCache.get("it")).toBe("https://it.example.com");
    });

    it("uses first element from array origins", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(createMockAtlas(), locales, defaultLocale, {
        en: ["https://en.example.com", "https://en-alt.example.com"],
        it: ["https://it.example.com", "https://it-alt.example.com"],
      });

      expect((translator as any).localeOriginMapCache.get("en")).toBe("https://en.example.com");
      expect((translator as any).localeOriginMapCache.get("it")).toBe("https://it.example.com");
    });

    it("handles mix of string and array origins", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(createMockAtlas(), locales, defaultLocale, {
        en: "https://en.example.com",
        it: ["https://it.example.com", "https://it-alt.example.com"],
      });

      expect((translator as any).localeOriginMapCache.get("en")).toBe("https://en.example.com");
      expect((translator as any).localeOriginMapCache.get("it")).toBe("https://it.example.com");
    });
  });

  describe("adapter", () => {
    it("prepends origin to translated path", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(aboutAtlas, locales, defaultLocale, {
        en: "https://en.example.com",
        it: "https://it.example.com",
      });

      expect(translator.get("en", "/about", {})).toEqual({
        value: "https://en.example.com/about",
        dynamic: false,
      });
      expect(translator.get("it", "/about", {})).toEqual({
        value: "https://it.example.com/chi-siamo",
        dynamic: false,
      });
    });

    it("prepends origin to root path", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(createMockAtlas(), locales, defaultLocale, {
        en: "https://en.example.com",
        it: "https://it.example.com",
      });

      expect(translator.get("en", "/", {})).toEqual({
        value: "https://en.example.com/",
        dynamic: false,
      });
      expect(translator.get("it", "/", {})).toEqual({
        value: "https://it.example.com/",
        dynamic: false,
      });
    });

    it("prepends origin to dynamic paths", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(productsAtlas, locales, defaultLocale, {
        en: "https://en.example.com",
        it: "https://it.example.com",
      });

      expect(translator.get("en", "/products/[id]", { id: "123" })).toEqual({
        value: "https://en.example.com/products/123",
        dynamic: true,
      });
      expect(translator.get("it", "/products/[id]", { id: "456" })).toEqual({
        value: "https://it.example.com/prodotti/456",
        dynamic: true,
      });
    });

    it("throws RMachineConfigError when locale has no origin", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(createMockAtlas(), ["en", "it", "fr"], defaultLocale, {
        en: "https://en.example.com",
        it: "https://it.example.com",
      });

      expect(() => translator.get("fr", "/about", {})).toThrow(RMachineConfigError);
      expect(() => translator.get("fr", "/about", {})).toThrow(/No origin defined for locale 'fr' in localeOriginMap/);
    });

    it("uses the first origin when locale maps to an array", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(aboutAtlas, locales, defaultLocale, {
        en: ["https://primary.en.example.com", "https://secondary.en.example.com"],
        it: "https://it.example.com",
      });

      expect(translator.get("en", "/about", {})).toEqual({
        value: "https://primary.en.example.com/about",
        dynamic: false,
      });
    });
  });

  describe("extends HrefTranslator", () => {
    it("is an instance of HrefTranslator", () => {
      const translator = new NextAppOriginStrategyUrlTranslator(createMockAtlas(), locales, defaultLocale, {
        en: "https://en.example.com",
        it: "https://it.example.com",
      });

      expect(translator).toBeInstanceOf(HrefTranslator);
    });

    it("preserves translation capabilities from HrefTranslator", () => {
      const atlas = createMockAtlas({
        "/about": { it: "/chi-siamo", "/team": { it: "/staff" } },
      });
      const translator = new NextAppOriginStrategyUrlTranslator(atlas, locales, defaultLocale, {
        en: "https://en.example.com",
        it: "https://it.example.com",
      });

      expect(translator.get("it", "/about/team", {})).toEqual({
        value: "https://it.example.com/chi-siamo/staff",
        dynamic: false,
      });
    });
  });
});
