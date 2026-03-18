import { RMachineConfigError } from "r-machine/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { NextAppStrategyCore } from "#r-machine/next/core/app";
import {
  type NextAppPathStrategyConfig,
  NextAppPathStrategyCore,
  NextAppPathStrategyPathCanonicalizer,
  NextAppPathStrategyPathTranslator,
} from "../../../../src/core/app/path/next-app-path-strategy-core.js";
import {
  aboutAtlas,
  createMockAtlas,
  DynamicPathAtlas,
  productsAtlas,
  SimplePathAtlas,
  TranslatedPathAtlas,
} from "../../../_fixtures/_helpers.js";
import type { TestLocale } from "../../../_fixtures/constants.js";
import { createMockMachine, type TestAtlas } from "../../../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// Mocks — external deps required by dynamically imported modules
// ---------------------------------------------------------------------------

const mockCreateClientImpl = vi.fn();
const mockCreateServerImpl = vi.fn();

vi.mock("../../../../src/core/app/path/next-app-path.client-impl.js", () => ({
  createNextAppPathClientImpl: (...args: unknown[]) => mockCreateClientImpl(...args),
}));

vi.mock("../../../../src/core/app/path/next-app-path.server-impl.js", () => ({
  createNextAppPathServerImpl: (...args: unknown[]) => mockCreateServerImpl(...args),
}));

const mockCreateNoProxyServerToolset = vi.fn();

vi.mock("../../../../src/core/app/next-app-no-proxy-server-toolset.js", () => ({
  createNextAppNoProxyServerToolset: (...args: unknown[]) => mockCreateNoProxyServerToolset(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SimpleConfig = NextAppPathStrategyConfig<SimplePathAtlas, "locale">;
type TranslatedConfig = NextAppPathStrategyConfig<TranslatedPathAtlas, "locale">;
type DynamicConfig = NextAppPathStrategyConfig<DynamicPathAtlas, "locale">;

function createTestConfig(overrides?: Partial<SimpleConfig>): SimpleConfig {
  return {
    ...NextAppPathStrategyCore.defaultConfig,
    PathAtlas: SimplePathAtlas,
    ...overrides,
  } as SimpleConfig;
}

function createTestStrategy(configOverrides?: Partial<SimpleConfig>) {
  const config = createTestConfig(configOverrides);

  class TestPathStrategy extends NextAppPathStrategyCore<TestAtlas, TestLocale, SimpleConfig> {}

  const rMachine = createMockMachine();
  const strategy = new TestPathStrategy(rMachine, config);

  return { strategy, rMachine, config };
}

function createTranslatedStrategy(configOverrides?: Partial<TranslatedConfig>) {
  const config: TranslatedConfig = {
    ...NextAppPathStrategyCore.defaultConfig,
    PathAtlas: TranslatedPathAtlas,
    ...configOverrides,
  } as TranslatedConfig;

  class TestPathStrategy extends NextAppPathStrategyCore<TestAtlas, TestLocale, TranslatedConfig> {}

  const rMachine = createMockMachine();
  const strategy = new TestPathStrategy(rMachine, config);

  return { strategy, rMachine, config };
}

function createDynamicStrategy(configOverrides?: Partial<DynamicConfig>) {
  const config: DynamicConfig = {
    ...NextAppPathStrategyCore.defaultConfig,
    PathAtlas: DynamicPathAtlas,
    ...configOverrides,
  } as DynamicConfig;

  class TestPathStrategy extends NextAppPathStrategyCore<TestAtlas, TestLocale, DynamicConfig> {}

  const rMachine = createMockMachine();
  return new TestPathStrategy(rMachine, config);
}

const MockNextClientRMachine = vi.fn() as any;

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests — NextAppPathStrategyCore
// ---------------------------------------------------------------------------

describe("NextAppPathStrategyCore", () => {
  describe("defaultConfig", () => {
    it("extends NextAppStrategyCore.defaultConfig", () => {
      const config = NextAppPathStrategyCore.defaultConfig;
      expect(config.PathAtlas).toBe(NextAppStrategyCore.defaultConfig.PathAtlas);
      expect(config.localeKey).toBe(NextAppStrategyCore.defaultConfig.localeKey);
      expect(config.autoLocaleBinding).toBe(NextAppStrategyCore.defaultConfig.autoLocaleBinding);
      expect(config.basePath).toBe(NextAppStrategyCore.defaultConfig.basePath);
    });

    it('defaults cookie to "off"', () => {
      expect(NextAppPathStrategyCore.defaultConfig.cookie).toBe("off");
    });

    it('defaults localeLabel to "lowercase"', () => {
      expect(NextAppPathStrategyCore.defaultConfig.localeLabel).toBe("lowercase");
    });

    it('defaults autoDetectLocale to "on"', () => {
      expect(NextAppPathStrategyCore.defaultConfig.autoDetectLocale).toBe("on");
    });

    it('defaults implicitDefaultLocale to "off"', () => {
      expect(NextAppPathStrategyCore.defaultConfig.implicitDefaultLocale).toBe("off");
    });
  });

  // -----------------------------------------------------------------------
  // Protected members initialization
  // -----------------------------------------------------------------------

  describe("protected members initialization", () => {
    it("creates pathAtlas from config.PathAtlas", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathAtlas).toBeDefined();
      expect((strategy as any).pathAtlas.decl).toEqual({});
    });

    it("creates pathTranslator as NextAppPathStrategyPathTranslator", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathTranslator).toBeInstanceOf(NextAppPathStrategyPathTranslator);
    });

    it("creates contentPathCanonicalizer as HrefCanonicalizer", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).contentPathCanonicalizer).toBeInstanceOf(HrefCanonicalizer);
    });

    it("creates pathCanonicalizer as NextAppPathStrategyPathCanonicalizer", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathCanonicalizer).toBeInstanceOf(NextAppPathStrategyPathCanonicalizer);
    });

    it("sets containsTranslations to false for atlas without translations", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathAtlas.containsTranslations).toBe(false);
    });

    it("sets containsTranslations to true for atlas with translations", () => {
      const { strategy } = createTranslatedStrategy();
      expect((strategy as any).pathAtlas.containsTranslations).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // validateConfig
  // -----------------------------------------------------------------------

  describe("validateConfig", () => {
    it("does not throw with default config", () => {
      expect(() => createTestStrategy()).not.toThrow();
    });

    it("does not throw when implicitDefaultLocale is off and cookie is off", () => {
      expect(() => createTestStrategy({ implicitDefaultLocale: "off", cookie: "off" })).not.toThrow();
    });

    it("does not throw when implicitDefaultLocale is off and cookie is on", () => {
      expect(() => createTestStrategy({ implicitDefaultLocale: "off", cookie: "on" })).not.toThrow();
    });

    it("does not throw when implicitDefaultLocale is on and cookie is on", () => {
      expect(() => createTestStrategy({ implicitDefaultLocale: "on", cookie: "on" })).not.toThrow();
    });

    it("does not throw when implicitDefaultLocale is custom and cookie is on", () => {
      expect(() =>
        createTestStrategy({
          implicitDefaultLocale: { pathMatcher: /^\/(?!api)/ },
          cookie: "on",
        })
      ).not.toThrow();
    });

    it("does not throw when implicitDefaultLocale is custom and cookie is custom", () => {
      expect(() =>
        createTestStrategy({
          implicitDefaultLocale: { pathMatcher: null },
          cookie: { name: "locale", maxAge: 3600, path: "/", sameSite: "lax" },
        })
      ).not.toThrow();
    });

    it("throws RMachineConfigError when implicitDefaultLocale is on but cookie is off", () => {
      expect(() => createTestStrategy({ implicitDefaultLocale: "on", cookie: "off" })).toThrow(RMachineConfigError);
    });

    it("throws with descriptive message for implicitDefaultLocale without cookie", () => {
      expect(() => createTestStrategy({ implicitDefaultLocale: "on", cookie: "off" })).toThrow(
        /implicitDefaultLocale.*cookie/
      );
    });

    it("throws when implicitDefaultLocale is custom object but cookie is off", () => {
      expect(() =>
        createTestStrategy({
          implicitDefaultLocale: { pathMatcher: null },
          cookie: "off",
        })
      ).toThrow(RMachineConfigError);
    });
  });

  // -----------------------------------------------------------------------
  // createClientImpl
  // -----------------------------------------------------------------------

  describe("createClientImpl", () => {
    it("delegates to createNextAppPathClientImpl with correct args", async () => {
      const { strategy, rMachine, config } = createTestStrategy();
      const expectedResult = { onLoad: undefined, writeLocale: vi.fn(), createUsePathComposer: vi.fn() };
      mockCreateClientImpl.mockReturnValue(expectedResult);

      const result = await (strategy as any).createClientImpl();

      expect(mockCreateClientImpl).toHaveBeenCalledOnce();
      expect(mockCreateClientImpl).toHaveBeenCalledWith(
        rMachine,
        config,
        (strategy as any).pathTranslator,
        (strategy as any).pathCanonicalizer
      );
      expect(result).toBe(expectedResult);
    });
  });

  // -----------------------------------------------------------------------
  // createServerImpl
  // -----------------------------------------------------------------------

  describe("createServerImpl", () => {
    it("delegates to createNextAppPathServerImpl with correct args", async () => {
      const { strategy, rMachine, config } = createTestStrategy();
      const expectedResult = { localeKey: "locale" };
      mockCreateServerImpl.mockReturnValue(expectedResult);

      const result = await (strategy as any).createServerImpl();

      expect(mockCreateServerImpl).toHaveBeenCalledOnce();
      expect(mockCreateServerImpl).toHaveBeenCalledWith(
        rMachine,
        config,
        (strategy as any).pathTranslator,
        (strategy as any).contentPathCanonicalizer
      );
      expect(result).toBe(expectedResult);
    });
  });

  // -----------------------------------------------------------------------
  // validateNoProxyConfig
  // -----------------------------------------------------------------------

  describe("validateNoProxyConfig", () => {
    it("does not throw when all proxy options off and no translations", () => {
      const { strategy } = createTestStrategy({ autoDetectLocale: "off" });
      expect(() => (strategy as any).validateNoProxyConfig()).not.toThrow();
    });

    it("throws RMachineConfigError when implicitDefaultLocale is on", () => {
      const { strategy } = createTestStrategy({ implicitDefaultLocale: "on", cookie: "on" });
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(RMachineConfigError);
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(/implicitDefaultLocale.*proxy/i);
    });

    it("throws RMachineConfigError when implicitDefaultLocale is custom", () => {
      const { strategy } = createTestStrategy({
        implicitDefaultLocale: { pathMatcher: null },
        cookie: "on",
      });
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(RMachineConfigError);
    });

    it("throws RMachineConfigError when autoLocaleBinding is on", () => {
      const { strategy } = createTestStrategy({ autoLocaleBinding: "on" });
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(RMachineConfigError);
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(/autoLocaleBinding.*proxy/i);
    });

    it("throws RMachineConfigError when autoDetectLocale is on", () => {
      const { strategy } = createTestStrategy({ autoDetectLocale: "on" });
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(RMachineConfigError);
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(/autoDetectLocale.*proxy/i);
    });

    it("throws RMachineConfigError when autoDetectLocale is custom", () => {
      const { strategy } = createTestStrategy({ autoDetectLocale: { pathMatcher: /^\// } });
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(RMachineConfigError);
    });

    it("throws RMachineConfigError when PathAtlas contains translations", () => {
      const { strategy } = createTranslatedStrategy({ autoDetectLocale: "off" });
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(RMachineConfigError);
      expect(() => (strategy as any).validateNoProxyConfig()).toThrow(/PathAtlas.*translations.*proxy/i);
    });

    it("does not throw when dynamic paths exist but no translations", () => {
      const strategy = createDynamicStrategy({ autoDetectLocale: "off" });
      expect(() => (strategy as any).validateNoProxyConfig()).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // createNoProxyServerToolset
  // -----------------------------------------------------------------------

  describe("createNoProxyServerToolset", () => {
    it("calls createServerImpl and createNoProxyServerToolset", async () => {
      const { strategy } = createTestStrategy({ autoDetectLocale: "off" });
      const mockImpl = { localeKey: "locale" };
      mockCreateServerImpl.mockReturnValue(mockImpl);
      const expectedToolset = { bindLocale: vi.fn() };
      mockCreateNoProxyServerToolset.mockReturnValue(expectedToolset);

      await strategy.createNoProxyServerToolset(MockNextClientRMachine);

      expect(mockCreateServerImpl).toHaveBeenCalledOnce();
      expect(mockCreateNoProxyServerToolset).toHaveBeenCalledOnce();
    });

    it("delegates to createNextAppNoProxyServerToolset with correct args", async () => {
      const { strategy, rMachine } = createTestStrategy({ autoDetectLocale: "off" });
      const mockImpl = { localeKey: "locale" };
      mockCreateServerImpl.mockReturnValue(mockImpl);
      const expectedToolset = { bindLocale: vi.fn() };
      mockCreateNoProxyServerToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createNoProxyServerToolset(MockNextClientRMachine);

      expect(mockCreateNoProxyServerToolset).toHaveBeenCalledWith(rMachine, mockImpl, MockNextClientRMachine);
      expect(result).toBe(expectedToolset);
    });

    it("rejects when validateNoProxyConfig throws and does not call createServerImpl", async () => {
      const { strategy } = createTranslatedStrategy();

      await expect(strategy.createNoProxyServerToolset(MockNextClientRMachine)).rejects.toThrow(RMachineConfigError);
      expect(mockCreateServerImpl).not.toHaveBeenCalled();
    });

    it("rejects when createServerImpl fails", async () => {
      const { strategy } = createTestStrategy({ autoDetectLocale: "off" });
      mockCreateServerImpl.mockImplementation(() => {
        throw new Error("server impl failure");
      });

      await expect(strategy.createNoProxyServerToolset(MockNextClientRMachine)).rejects.toThrow("server impl failure");
    });
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    describe("getPath", () => {
      it("returns root path for any locale", () => {
        const strategy = createDynamicStrategy();

        expect(strategy.hrefHelper.getPath("en", "/")).toBe("/en/");
        expect(strategy.hrefHelper.getPath("it", "/")).toBe("/it/");
      });

      it("returns locale-prefixed paths for declared paths", () => {
        const { strategy } = createTranslatedStrategy();

        expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/en/about");
        expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
      });

      it("substitutes dynamic segment params", () => {
        const { strategy } = createTranslatedStrategy();

        expect(strategy.hrefHelper.getPath("en", "/products/[id]", { id: "42" })).toBe("/en/products/42");
        expect(strategy.hrefHelper.getPath("it", "/products/[id]", { id: "42" })).toBe("/it/prodotti/42");
      });

      it("lowercases mixed-case locale in prefix", () => {
        const config: DynamicConfig = {
          ...NextAppPathStrategyCore.defaultConfig,
          PathAtlas: DynamicPathAtlas,
          localeLabel: "lowercase",
        } as DynamicConfig;

        class TestPathStrategy extends NextAppPathStrategyCore<TestAtlas, TestLocale, DynamicConfig> {}

        const rMachine = createMockMachine({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" });
        const strategy = new TestPathStrategy(rMachine, config);

        expect(strategy.hrefHelper.getPath("en-US" as any, "/about")).toBe("/en-us/about");
        expect(strategy.hrefHelper.getPath("it-IT" as any, "/about")).toBe("/it-it/about");
      });

      it("preserves locale case with strict localeLabel", () => {
        const config: DynamicConfig = {
          ...NextAppPathStrategyCore.defaultConfig,
          PathAtlas: DynamicPathAtlas,
          localeLabel: "strict",
        } as DynamicConfig;

        class TestPathStrategy extends NextAppPathStrategyCore<TestAtlas, TestLocale, DynamicConfig> {}

        const rMachine = createMockMachine({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" });
        const strategy = new TestPathStrategy(rMachine, config);

        expect(strategy.hrefHelper.getPath("en-US" as any, "/about")).toBe("/en-US/about");
        expect(strategy.hrefHelper.getPath("it-IT" as any, "/about")).toBe("/it-IT/about");
      });

      it("omits locale prefix for default locale when implicitDefaultLocale is on", () => {
        const { strategy } = createTranslatedStrategy({ implicitDefaultLocale: "on", cookie: "on" });

        expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/about");
        expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
      });

      it("omits locale prefix for default locale when implicitDefaultLocale is custom", () => {
        const { strategy } = createTranslatedStrategy({
          implicitDefaultLocale: { pathMatcher: null },
          cookie: "on",
        });

        expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/about");
        expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
      });

      it("does not prepend basePath to the result", () => {
        const { strategy } = createTranslatedStrategy({ basePath: "/app" });

        expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/en/about");
        expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — NextAppPathStrategyPathTranslator
// ---------------------------------------------------------------------------

describe("NextAppPathStrategyPathTranslator", () => {
  const tLocales = ["en", "it"];
  const tDefaultLocale = "en";

  describe("extends HrefTranslator", () => {
    it("is an instance of HrefTranslator", () => {
      const translator = new NextAppPathStrategyPathTranslator(
        createMockAtlas(),
        tLocales,
        tDefaultLocale,
        true,
        false
      );

      expect(translator).toBeInstanceOf(HrefTranslator);
    });
  });

  describe("adapter", () => {
    it("has preApply set to false", () => {
      const translator = new NextAppPathStrategyPathTranslator(
        createMockAtlas(),
        tLocales,
        tDefaultLocale,
        true,
        false
      );

      expect((translator as any).adapter.preApply).toBe(false);
    });
  });

  describe("locale prefix", () => {
    it("prefixes path with lowercased locale when lowercaseLocale is true", () => {
      const translator = new NextAppPathStrategyPathTranslator(
        createMockAtlas(),
        tLocales,
        tDefaultLocale,
        true,
        false
      );

      expect(translator.get("en", "/", {})).toEqual({ value: "/en/", dynamic: false });
      expect(translator.get("it", "/", {})).toEqual({ value: "/it/", dynamic: false });
    });

    it("prefixes path with original locale when lowercaseLocale is false", () => {
      const translator = new NextAppPathStrategyPathTranslator(
        createMockAtlas(),
        tLocales,
        tDefaultLocale,
        false,
        false
      );

      expect(translator.get("en", "/", {})).toEqual({ value: "/en/", dynamic: false });
      expect(translator.get("it", "/", {})).toEqual({ value: "/it/", dynamic: false });
    });

    it("lowercases mixed-case locale when lowercaseLocale is true", () => {
      const mixedLocales = ["en-US", "it-IT"];
      const translator = new NextAppPathStrategyPathTranslator(createMockAtlas(), mixedLocales, "en-US", true, false);

      expect(translator.get("en-US", "/", {})).toEqual({ value: "/en-us/", dynamic: false });
      expect(translator.get("it-IT", "/", {})).toEqual({ value: "/it-it/", dynamic: false });
    });

    it("preserves mixed-case locale when lowercaseLocale is false", () => {
      const mixedLocales = ["en-US", "it-IT"];
      const translator = new NextAppPathStrategyPathTranslator(createMockAtlas(), mixedLocales, "en-US", false, false);

      expect(translator.get("en-US", "/", {})).toEqual({ value: "/en-US/", dynamic: false });
      expect(translator.get("it-IT", "/", {})).toEqual({ value: "/it-IT/", dynamic: false });
    });
  });

  describe("implicitDefaultLocale", () => {
    it("returns path without locale prefix for default locale when enabled", () => {
      const translator = new NextAppPathStrategyPathTranslator(createMockAtlas(), tLocales, tDefaultLocale, true, true);

      expect(translator.get("en", "/", {})).toEqual({ value: "/", dynamic: false });
    });

    it("still prefixes non-default locale when enabled", () => {
      const translator = new NextAppPathStrategyPathTranslator(createMockAtlas(), tLocales, tDefaultLocale, true, true);

      expect(translator.get("it", "/", {})).toEqual({ value: "/it/", dynamic: false });
    });

    it("prefixes default locale when disabled", () => {
      const translator = new NextAppPathStrategyPathTranslator(
        createMockAtlas(),
        tLocales,
        tDefaultLocale,
        true,
        false
      );

      expect(translator.get("en", "/", {})).toEqual({ value: "/en/", dynamic: false });
    });
  });

  describe("path translation", () => {
    it("translates declared paths", () => {
      const translator = new NextAppPathStrategyPathTranslator(aboutAtlas, tLocales, tDefaultLocale, true, false);

      expect(translator.get("en", "/about", {})).toEqual({ value: "/en/about", dynamic: false });
      expect(translator.get("it", "/about", {})).toEqual({ value: "/it/chi-siamo", dynamic: false });
    });

    it("translates declared paths with implicit default locale", () => {
      const translator = new NextAppPathStrategyPathTranslator(aboutAtlas, tLocales, tDefaultLocale, true, true);

      expect(translator.get("en", "/about", {})).toEqual({ value: "/about", dynamic: false });
      expect(translator.get("it", "/about", {})).toEqual({ value: "/it/chi-siamo", dynamic: false });
    });

    it("handles dynamic segments with params", () => {
      const translator = new NextAppPathStrategyPathTranslator(productsAtlas, tLocales, tDefaultLocale, true, false);

      expect(translator.get("en", "/products/[id]", { id: "42" })).toEqual({
        value: "/en/products/42",
        dynamic: true,
      });
      expect(translator.get("it", "/products/[id]", { id: "42" })).toEqual({
        value: "/it/prodotti/42",
        dynamic: true,
      });
    });

    it("returns undeclared paths as-is with locale prefix", () => {
      const translator = new NextAppPathStrategyPathTranslator(
        createMockAtlas(),
        tLocales,
        tDefaultLocale,
        true,
        false
      );

      expect(translator.get("en", "/unknown", {})).toEqual({ value: "/en/unknown", dynamic: false });
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — NextAppPathStrategyPathCanonicalizer
// ---------------------------------------------------------------------------

describe("NextAppPathStrategyPathCanonicalizer", () => {
  const cLocales = ["en", "it"];
  const cDefaultLocale = "en";

  describe("extends HrefCanonicalizer", () => {
    it("is an instance of HrefCanonicalizer", () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(
        createMockAtlas(),
        cLocales,
        cDefaultLocale,
        false
      );

      expect(canonicalizer).toBeInstanceOf(HrefCanonicalizer);
    });
  });

  describe("adapter", () => {
    it("has preApply set to true", () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(
        createMockAtlas(),
        cLocales,
        cDefaultLocale,
        false
      );

      expect((canonicalizer as any).adapter.preApply).toBe(true);
    });
  });

  describe("strip locale prefix", () => {
    it('strips locale prefix and returns content path (e.g. "/en/about" → "/about")', () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(aboutAtlas, cLocales, cDefaultLocale, false);

      expect(canonicalizer.get("en", "/en/about")).toEqual({ value: "/about", dynamic: false });
      expect(canonicalizer.get("it", "/it/chi-siamo")).toEqual({ value: "/about", dynamic: false });
    });

    it('returns "/" when path has no content segment after locale (e.g. "/en")', () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(
        createMockAtlas(),
        cLocales,
        cDefaultLocale,
        false
      );

      expect(canonicalizer.get("en", "/en")).toEqual({ value: "/", dynamic: false });
      expect(canonicalizer.get("it", "/it")).toEqual({ value: "/", dynamic: false });
    });

    it("handles paths with dynamic segments", () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(productsAtlas, cLocales, cDefaultLocale, false);

      expect(canonicalizer.get("en", "/en/products/[id]")).toEqual({
        value: "/products/[id]",
        dynamic: true,
      });
    });
  });

  describe("implicitDefaultLocale", () => {
    it("returns path as-is for default locale when enabled", () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(aboutAtlas, cLocales, cDefaultLocale, true);

      expect(canonicalizer.get("en", "/about")).toEqual({ value: "/about", dynamic: false });
    });

    it("still strips locale prefix for non-default locale when enabled", () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(aboutAtlas, cLocales, cDefaultLocale, true);

      expect(canonicalizer.get("it", "/it/chi-siamo")).toEqual({ value: "/about", dynamic: false });
    });

    it("strips locale prefix for default locale when disabled", () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(aboutAtlas, cLocales, cDefaultLocale, false);

      expect(canonicalizer.get("en", "/en/about")).toEqual({ value: "/about", dynamic: false });
    });

    it('returns "/" for root path of non-default locale when enabled', () => {
      const canonicalizer = new NextAppPathStrategyPathCanonicalizer(createMockAtlas(), cLocales, cDefaultLocale, true);

      expect(canonicalizer.get("it", "/it")).toEqual({ value: "/", dynamic: false });
    });
  });
});
