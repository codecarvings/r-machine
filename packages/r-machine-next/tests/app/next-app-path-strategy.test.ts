import { afterEach, describe, expect, it, vi } from "vitest";
import { NextAppPathStrategyCore } from "#r-machine/next/core/app/path";
import { NextAppPathStrategy } from "../../src/app/path/next-app-path-strategy.js";
import { DynamicPathAtlas, TranslatedPathAtlas } from "../_fixtures/_helpers.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// Mocks — external deps required by dynamically imported modules
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { rewrite: vi.fn(), next: vi.fn() },
}));

const mockCreateClientToolset = vi.fn();
const mockCreateServerToolset = vi.fn();

vi.mock("../../src/core/app/next-app-client-toolset.js", () => ({
  createNextAppClientToolset: (...args: unknown[]) => mockCreateClientToolset(...args),
}));

vi.mock("../../src/core/app/next-app-server-toolset.js", () => ({
  createNextAppServerToolset: (...args: unknown[]) => mockCreateServerToolset(...args),
}));

const mockCreateNoProxyServerToolset = vi.fn();

vi.mock("../../src/core/app/next-app-no-proxy-server-toolset.js", () => ({
  createNextAppNoProxyServerToolset: (...args: unknown[]) => mockCreateNoProxyServerToolset(...args),
}));

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
});

// Structural helper: `config` and `rMachine` are protected — cast for assertions.
type ReadCfg = {
  cookie?: unknown;
  localeLabel?: unknown;
  autoDetectLocale?: unknown;
  implicitDefaultLocale?: unknown;
  localeKey?: unknown;
  autoLocaleBinding?: unknown;
  basePath?: unknown;
  PathAtlas?: unknown;
};
const readConfig = (s: unknown): ReadCfg => (s as { config: ReadCfg }).config;
const readRMachine = (s: unknown): unknown => (s as { rMachine: unknown }).rMachine;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NextAppPathStrategy", () => {
  // -----------------------------------------------------------------------
  // create — the factory unique to this class (defaults merging)
  // -----------------------------------------------------------------------

  describe("create", () => {
    it("applies all defaults when called with rMachine and empty params", () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {});

      expect(readRMachine(strategy)).toBe(rMachine);
      expect(readConfig(strategy).cookie).toBe("off");
      expect(readConfig(strategy).localeLabel).toBe("lowercase");
      expect(readConfig(strategy).autoDetectLocale).toBe("on");
      expect(readConfig(strategy).implicitDefaultLocale).toBe("off");
      expect(readConfig(strategy).localeKey).toBe("locale");
      expect(readConfig(strategy).autoLocaleBinding).toBe("off");
      expect(readConfig(strategy).basePath).toBe("");
      expect(readConfig(strategy).PathAtlas).toBe(NextAppPathStrategyCore.defaultConfig.PathAtlas);
    });

    it("preserves non-overridden defaults when partial params are provided", () => {
      const rMachine = createMockMachine();
      const customCookie = { name: "lang", path: "/", sameSite: "lax" as const };
      const strategy = NextAppPathStrategy.create(rMachine, {
        cookie: customCookie,
        basePath: "/docs",
      });

      expect(readConfig(strategy).cookie).toBe(customCookie);
      expect(readConfig(strategy).basePath).toBe("/docs");
      expect(readConfig(strategy).localeLabel).toBe("lowercase");
      expect(readConfig(strategy).autoDetectLocale).toBe("on");
      expect(readConfig(strategy).implicitDefaultLocale).toBe("off");
      expect(readConfig(strategy).localeKey).toBe("locale");
      expect(readConfig(strategy).autoLocaleBinding).toBe("off");
    });

    it("applies all overrides when full params are provided", () => {
      const rMachine = createMockMachine();
      const customCookie = { name: "lang", path: "/", sameSite: "strict" as const };
      const strategy = NextAppPathStrategy.create(rMachine, {
        cookie: customCookie,
        localeLabel: "strict",
        autoDetectLocale: "off",
        implicitDefaultLocale: "off",
        localeKey: "lang",
        autoLocaleBinding: "on",
        basePath: "/app",
        PathAtlas: DynamicPathAtlas,
      });

      expect(readConfig(strategy).cookie).toBe(customCookie);
      expect(readConfig(strategy).localeLabel).toBe("strict");
      expect(readConfig(strategy).autoDetectLocale).toBe("off");
      expect(readConfig(strategy).implicitDefaultLocale).toBe("off");
      expect(readConfig(strategy).localeKey).toBe("lang");
      expect(readConfig(strategy).autoLocaleBinding).toBe("on");
      expect(readConfig(strategy).basePath).toBe("/app");
      expect(readConfig(strategy).PathAtlas).toBe(DynamicPathAtlas);
    });

    it("propagates validateConfig error when implicitDefaultLocale is on but cookie is off", () => {
      const rMachine = createMockMachine();

      expect(() => NextAppPathStrategy.create(rMachine, { implicitDefaultLocale: "on", cookie: "off" })).toThrow(
        /implicitDefaultLocale.*cookie/
      );
    });

    it("propagates validateConfig error when implicitDefaultLocale is custom but cookie is off", () => {
      const rMachine = createMockMachine();

      expect(() =>
        NextAppPathStrategy.create(rMachine, {
          implicitDefaultLocale: { pathMatcher: null },
          cookie: "off",
        })
      ).toThrow(/implicitDefaultLocale.*cookie/);
    });

    it("does not throw when implicitDefaultLocale is on and cookie is on", () => {
      const rMachine = createMockMachine();

      expect(() => NextAppPathStrategy.create(rMachine, { implicitDefaultLocale: "on", cookie: "on" })).not.toThrow();
    });

    it("produces a config that is not the same reference as defaultConfig", () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {});
      expect(readConfig(strategy)).not.toBe(NextAppPathStrategyCore.defaultConfig);
    });
  });

  // -----------------------------------------------------------------------
  // createClientToolset — inherited from NextAppStrategyCore
  // -----------------------------------------------------------------------

  describe("createClientToolset", () => {
    it("delegates to createNextAppClientToolset with rMachine and path-specific impl", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {});
      mockCreateClientToolset.mockReturnValue({});

      await strategy.createClientToolset();

      expect(mockCreateClientToolset).toHaveBeenCalledOnce();
      expect(mockCreateClientToolset.mock.calls[0]![0]).toBe(rMachine);
    });

    it("returns the toolset produced by the factory", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {});
      const expectedToolset = { useLocale: vi.fn() };
      mockCreateClientToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createClientToolset();

      expect(result).toBe(expectedToolset);
    });
  });

  // -----------------------------------------------------------------------
  // createServerToolset — inherited from NextAppStrategyCore
  // -----------------------------------------------------------------------

  describe("createServerToolset", () => {
    it("delegates to createNextAppServerToolset with rMachine, serverKit, impl, and NextClientRMachine", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {});
      const MockClientRMachine = vi.fn();
      mockCreateServerToolset.mockReturnValue({});

      await strategy.createServerToolset(MockClientRMachine as any);

      expect(mockCreateServerToolset).toHaveBeenCalledOnce();
      expect(mockCreateServerToolset.mock.calls[0]![0]).toBe(rMachine);
      expect(mockCreateServerToolset.mock.calls[0]![3]).toBe(MockClientRMachine);
    });

    it("returns the toolset produced by the factory", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {});
      const MockClientRMachine = vi.fn();
      const expectedToolset = { getLocale: vi.fn() };
      mockCreateServerToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createServerToolset(MockClientRMachine as any);

      expect(result).toBe(expectedToolset);
    });
  });

  // -----------------------------------------------------------------------
  // createNoProxyServerToolset — unique to path strategy
  // -----------------------------------------------------------------------

  describe("createNoProxyServerToolset", () => {
    it("returns the toolset when config is proxy-free", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, { autoDetectLocale: "off" });
      const MockClientRMachine = vi.fn() as any;
      const expectedToolset = { bindLocale: vi.fn() };
      mockCreateNoProxyServerToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createNoProxyServerToolset(MockClientRMachine);

      expect(result).toBe(expectedToolset);
    });

    it("rejects when autoDetectLocale requires proxy (on by default)", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {});
      const MockClientRMachine = vi.fn() as any;

      await expect(strategy.createNoProxyServerToolset(MockClientRMachine)).rejects.toThrow(/autoDetectLocale/);
    });

    it("rejects when implicitDefaultLocale requires proxy", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {
        autoDetectLocale: "off",
        implicitDefaultLocale: "on",
        cookie: "on",
      });
      const MockClientRMachine = vi.fn() as any;

      await expect(strategy.createNoProxyServerToolset(MockClientRMachine)).rejects.toThrow(/implicitDefaultLocale/);
    });

    it("rejects when autoLocaleBinding requires proxy", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {
        autoDetectLocale: "off",
        autoLocaleBinding: "on",
      });
      const MockClientRMachine = vi.fn() as any;

      await expect(strategy.createNoProxyServerToolset(MockClientRMachine)).rejects.toThrow(/autoLocaleBinding/);
    });

    it("rejects when PathAtlas contains translations", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppPathStrategy.create(rMachine, {
        autoDetectLocale: "off",
        PathAtlas: TranslatedPathAtlas,
      });
      const MockClientRMachine = vi.fn() as any;

      await expect(strategy.createNoProxyServerToolset(MockClientRMachine)).rejects.toThrow(/PathAtlas.*translations/);
    });
  });

  // -----------------------------------------------------------------------
  // Integration — end-to-end with a translated PathAtlas
  // -----------------------------------------------------------------------

  describe("integration", () => {
    function createTranslatedStrategy(overrides: Record<string, unknown> = {}) {
      return NextAppPathStrategy.create(createMockMachine(), {
        PathAtlas: TranslatedPathAtlas,
        ...overrides,
      });
    }

    it("getPath returns locale-prefixed translated path for non-default locale", () => {
      const strategy = createTranslatedStrategy();
      expect((strategy as any).hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
    });

    it("getPath returns locale-prefixed untranslated path for default locale", () => {
      const strategy = createTranslatedStrategy();
      expect((strategy as any).hrefHelper.getPath("en", "/about")).toBe("/en/about");
    });

    it("getPath interpolates dynamic params with translation", () => {
      const strategy = createTranslatedStrategy();
      expect((strategy as any).hrefHelper.getPath("it", "/products/[id]", { id: "42" })).toBe("/it/prodotti/42");
    });

    it("getPath interpolates dynamic params for default locale", () => {
      const strategy = createTranslatedStrategy();
      expect((strategy as any).hrefHelper.getPath("en", "/products/[id]", { id: "42" })).toBe("/en/products/42");
    });

    it("getPath omits locale prefix for default locale when implicitDefaultLocale is on", () => {
      const strategy = createTranslatedStrategy({
        implicitDefaultLocale: "on",
        cookie: "on",
      });

      expect((strategy as any).hrefHelper.getPath("en", "/about")).toBe("/about");
      expect((strategy as any).hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
    });

    it("getPath respects localeLabel strict mode", () => {
      const strategy = NextAppPathStrategy.create(
        createMockMachine({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" }),
        { PathAtlas: TranslatedPathAtlas, localeLabel: "strict" }
      );

      expect((strategy as any).hrefHelper.getPath("en-US" as any, "/about")).toBe("/en-US/about");
    });

    it("getPath lowercases locale in prefix by default", () => {
      const strategy = NextAppPathStrategy.create(
        createMockMachine({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" }),
        { PathAtlas: TranslatedPathAtlas }
      );

      expect((strategy as any).hrefHelper.getPath("en-US" as any, "/about")).toBe("/en-us/about");
    });

    it("getPath handles root path /", () => {
      const strategy = createTranslatedStrategy();

      expect((strategy as any).hrefHelper.getPath("en", "/")).toBe("/en");
      expect((strategy as any).hrefHelper.getPath("it", "/")).toBe("/it");
    });

    it("getPath omits locale prefix for root path when implicitDefaultLocale is on", () => {
      const strategy = createTranslatedStrategy({
        implicitDefaultLocale: "on",
        cookie: "on",
      });

      expect((strategy as any).hrefHelper.getPath("en", "/")).toBe("/");
      expect((strategy as any).hrefHelper.getPath("it", "/")).toBe("/it");
    });

    it("getPath is unaffected by basePath configuration", () => {
      const strategy = NextAppPathStrategy.create(createMockMachine(), {
        PathAtlas: TranslatedPathAtlas,
        basePath: "/docs",
      });

      expect((strategy as any).hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
      expect((strategy as any).hrefHelper.getPath("en", "/about")).toBe("/en/about");
    });

    it("getPath falls back to original path for locale without translation", () => {
      const strategy = NextAppPathStrategy.create(
        createMockMachine({ locales: ["en", "it", "fr"], defaultLocale: "en" }),
        { PathAtlas: TranslatedPathAtlas }
      );

      expect((strategy as any).hrefHelper.getPath("fr" as any, "/about")).toBe("/fr/about");
      expect((strategy as any).hrefHelper.getPath("fr" as any, "/products/[id]", { id: "7" })).toBe("/fr/products/7");
    });
  });
});
