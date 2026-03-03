import { afterEach, describe, expect, it, vi } from "vitest";
import { NextAppPathStrategy } from "../../src/app/next-app-path-strategy.js";
import { DynamicPathAtlas, TranslatedPathAtlas } from "../_fixtures/_helpers.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// Mocks — external deps required by dynamically imported modules
// ---------------------------------------------------------------------------

vi.mock("js-cookie", () => ({ default: { get: vi.fn() } }));
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

const mockCreatePathClientImpl = vi.fn();
const mockCreatePathServerImpl = vi.fn();

vi.mock("../../src/core/app/path/next-app-path.client-impl.js", () => ({
  createNextAppPathClientImpl: (...args: unknown[]) => mockCreatePathClientImpl(...args),
}));

vi.mock("../../src/core/app/path/next-app-path.server-impl.js", () => ({
  createNextAppPathServerImpl: (...args: unknown[]) => mockCreatePathServerImpl(...args),
}));

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NextAppPathStrategy", () => {
  // -----------------------------------------------------------------------
  // Constructor — the only logic unique to this class (defaults merging)
  // -----------------------------------------------------------------------

  describe("constructor", () => {
    it("applies all defaults when called with rMachine only", () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine);

      expect(strategy.rMachine).toBe(rMachine);
      expect(strategy.config.cookie).toBe("off");
      expect(strategy.config.localeLabel).toBe("lowercase");
      expect(strategy.config.autoDetectLocale).toBe("on");
      expect(strategy.config.implicitDefaultLocale).toBe("off");
      expect(strategy.config.localeKey).toBe("locale");
      expect(strategy.config.autoLocaleBinding).toBe("off");
      expect(strategy.config.basePath).toBe("");
      expect(strategy.config.PathAtlas).toBe(NextAppPathStrategy.defaultConfig.PathAtlas);
    });

    it("preserves non-overridden defaults when partial config is provided", () => {
      const rMachine = createMockMachine();
      const customCookie = { name: "lang", path: "/", sameSite: "lax" as const };
      const strategy = new NextAppPathStrategy(rMachine, {
        cookie: customCookie,
        basePath: "/docs",
      });

      expect(strategy.config.cookie).toBe(customCookie);
      expect(strategy.config.basePath).toBe("/docs");
      expect(strategy.config.localeLabel).toBe("lowercase");
      expect(strategy.config.autoDetectLocale).toBe("on");
      expect(strategy.config.implicitDefaultLocale).toBe("off");
      expect(strategy.config.localeKey).toBe("locale");
      expect(strategy.config.autoLocaleBinding).toBe("off");
    });

    it("applies all overrides when full config is provided", () => {
      const rMachine = createMockMachine();
      const customCookie = { name: "lang", path: "/", sameSite: "strict" as const };
      const strategy = new NextAppPathStrategy(rMachine, {
        cookie: customCookie,
        localeLabel: "strict",
        autoDetectLocale: "off",
        implicitDefaultLocale: "off",
        localeKey: "lang",
        autoLocaleBinding: "on",
        basePath: "/app",
        PathAtlas: DynamicPathAtlas,
      });

      expect(strategy.config.cookie).toBe(customCookie);
      expect(strategy.config.localeLabel).toBe("strict");
      expect(strategy.config.autoDetectLocale).toBe("off");
      expect(strategy.config.implicitDefaultLocale).toBe("off");
      expect(strategy.config.localeKey).toBe("lang");
      expect(strategy.config.autoLocaleBinding).toBe("on");
      expect(strategy.config.basePath).toBe("/app");
      expect(strategy.config.PathAtlas).toBe(DynamicPathAtlas);
    });

    it("propagates validateConfig error when implicitDefaultLocale is on but cookie is off", () => {
      const rMachine = createMockMachine();

      expect(
        () => new NextAppPathStrategy(rMachine, { implicitDefaultLocale: "on", cookie: "off" })
      ).toThrow(/implicitDefaultLocale.*cookie/);
    });

    it("propagates validateConfig error when implicitDefaultLocale is custom but cookie is off", () => {
      const rMachine = createMockMachine();

      expect(
        () =>
          new NextAppPathStrategy(rMachine, {
            implicitDefaultLocale: { pathMatcher: null },
            cookie: "off",
          })
      ).toThrow(/implicitDefaultLocale.*cookie/);
    });

    it("does not throw when implicitDefaultLocale is on and cookie is on", () => {
      const rMachine = createMockMachine();

      expect(
        () => new NextAppPathStrategy(rMachine, { implicitDefaultLocale: "on", cookie: "on" })
      ).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // createClientToolset — inherited from NextAppStrategyCore
  // -----------------------------------------------------------------------

  describe("createClientToolset", () => {
    it("delegates to createNextAppClientToolset with rMachine and path-specific impl", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine);
      const expectedImpl = { __marker: "path-client-impl" };
      mockCreatePathClientImpl.mockReturnValue(expectedImpl);
      mockCreateClientToolset.mockReturnValue({});

      await strategy.createClientToolset();

      expect(mockCreateClientToolset).toHaveBeenCalledOnce();
      expect(mockCreateClientToolset.mock.calls[0]![0]).toBe(rMachine);
      expect(mockCreateClientToolset.mock.calls[0]![1]).toBe(expectedImpl);
    });

    it("returns the toolset produced by the factory", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine);
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
    it("delegates to createNextAppServerToolset with rMachine, path-specific impl, and NextClientRMachine", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine);
      const MockClientRMachine = vi.fn();
      const expectedImpl = { __marker: "path-server-impl" };
      mockCreatePathServerImpl.mockReturnValue(expectedImpl);
      mockCreateServerToolset.mockReturnValue({});

      await strategy.createServerToolset(MockClientRMachine as any);

      expect(mockCreateServerToolset).toHaveBeenCalledOnce();
      expect(mockCreateServerToolset.mock.calls[0]![0]).toBe(rMachine);
      expect(mockCreateServerToolset.mock.calls[0]![1]).toBe(expectedImpl);
      expect(mockCreateServerToolset.mock.calls[0]![2]).toBe(MockClientRMachine);
    });

    it("returns the toolset produced by the factory", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine);
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
      const strategy = new NextAppPathStrategy(rMachine, { autoDetectLocale: "off" });
      const MockClientRMachine = vi.fn() as any;
      const expectedToolset = { bindLocale: vi.fn() };
      mockCreateNoProxyServerToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createNoProxyServerToolset(MockClientRMachine);

      expect(result).toBe(expectedToolset);
    });

    it("rejects when autoDetectLocale requires proxy (on by default)", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine);
      const MockClientRMachine = vi.fn() as any;

      await expect(strategy.createNoProxyServerToolset(MockClientRMachine)).rejects.toThrow(/autoDetectLocale/);
    });

    it("rejects when implicitDefaultLocale requires proxy", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine, {
        autoDetectLocale: "off",
        implicitDefaultLocale: "on",
        cookie: "on",
      });
      const MockClientRMachine = vi.fn() as any;

      await expect(strategy.createNoProxyServerToolset(MockClientRMachine)).rejects.toThrow(/implicitDefaultLocale/);
    });

    it("rejects when autoLocaleBinding requires proxy", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine, {
        autoDetectLocale: "off",
        autoLocaleBinding: "on",
      });
      const MockClientRMachine = vi.fn() as any;

      await expect(strategy.createNoProxyServerToolset(MockClientRMachine)).rejects.toThrow(/autoLocaleBinding/);
    });

    it("rejects when PathAtlas contains translations", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppPathStrategy(rMachine, {
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
      return new NextAppPathStrategy(createMockMachine(), {
        PathAtlas: TranslatedPathAtlas,
        ...overrides,
      });
    }

    it("getPath returns locale-prefixed translated path for non-default locale", () => {
      const strategy = createTranslatedStrategy();
      expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
    });

    it("getPath returns locale-prefixed untranslated path for default locale", () => {
      const strategy = createTranslatedStrategy();
      expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/en/about");
    });

    it("getPath interpolates dynamic params with translation", () => {
      const strategy = createTranslatedStrategy();
      expect(strategy.hrefHelper.getPath("it", "/products/[id]", { id: "42" })).toBe("/it/prodotti/42");
    });

    it("getPath interpolates dynamic params for default locale", () => {
      const strategy = createTranslatedStrategy();
      expect(strategy.hrefHelper.getPath("en", "/products/[id]", { id: "42" })).toBe("/en/products/42");
    });

    it("getPath omits locale prefix for default locale when implicitDefaultLocale is on", () => {
      const strategy = createTranslatedStrategy({
        implicitDefaultLocale: "on",
        cookie: "on",
      });

      expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/about");
      expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
    });

    it("getPath respects localeLabel strict mode", () => {
      const strategy = new NextAppPathStrategy(
        createMockMachine({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" }),
        { PathAtlas: TranslatedPathAtlas, localeLabel: "strict" }
      );

      expect(strategy.hrefHelper.getPath("en-US", "/about")).toBe("/en-US/about");
    });

    it("getPath lowercases locale in prefix by default", () => {
      const strategy = new NextAppPathStrategy(
        createMockMachine({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" }),
        { PathAtlas: TranslatedPathAtlas }
      );

      expect(strategy.hrefHelper.getPath("en-US", "/about")).toBe("/en-us/about");
    });

    it("getPath handles root path /", () => {
      const strategy = createTranslatedStrategy();

      expect(strategy.hrefHelper.getPath("en", "/")).toBe("/en/");
      expect(strategy.hrefHelper.getPath("it", "/")).toBe("/it/");
    });

    it("getPath omits locale prefix for root path when implicitDefaultLocale is on", () => {
      const strategy = createTranslatedStrategy({
        implicitDefaultLocale: "on",
        cookie: "on",
      });

      expect(strategy.hrefHelper.getPath("en", "/")).toBe("/");
      expect(strategy.hrefHelper.getPath("it", "/")).toBe("/it/");
    });

    it("getPath is unaffected by basePath configuration", () => {
      const strategy = new NextAppPathStrategy(createMockMachine(), {
        PathAtlas: TranslatedPathAtlas,
        basePath: "/docs",
      });

      expect(strategy.hrefHelper.getPath("it", "/about")).toBe("/it/chi-siamo");
      expect(strategy.hrefHelper.getPath("en", "/about")).toBe("/en/about");
    });

    it("getPath falls back to original path for locale without translation", () => {
      const strategy = new NextAppPathStrategy(
        createMockMachine({ locales: ["en", "it", "fr"], defaultLocale: "en" }),
        { PathAtlas: TranslatedPathAtlas }
      );

      expect(strategy.hrefHelper.getPath("fr", "/about")).toBe("/fr/about");
      expect(strategy.hrefHelper.getPath("fr", "/products/[id]", { id: "7" })).toBe("/fr/products/7");
    });
  });
});
