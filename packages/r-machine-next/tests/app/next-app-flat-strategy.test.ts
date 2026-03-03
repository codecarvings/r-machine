import { defaultCookieDeclaration } from "r-machine/strategy/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultPathMatcher } from "#r-machine/next/internal";
import { NextAppFlatStrategy } from "../../src/app/next-app-flat-strategy.js";
import { DynamicPathAtlas } from "../_fixtures/_helpers.js";
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

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NextAppFlatStrategy", () => {
  // -----------------------------------------------------------------------
  // Constructor — the only logic unique to this class (defaults merging)
  // -----------------------------------------------------------------------

  describe("constructor", () => {
    it("applies all defaults when called with rMachine only", () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppFlatStrategy(rMachine);

      expect(strategy.rMachine).toBe(rMachine);
      expect(strategy.config.cookie).toBe(defaultCookieDeclaration);
      expect(strategy.config.pathMatcher).toBe(defaultPathMatcher);
      expect(strategy.config.localeKey).toBe("locale");
      expect(strategy.config.autoLocaleBinding).toBe("off");
      expect(strategy.config.basePath).toBe("");
    });

    it("preserves non-overridden defaults when partial config is provided", () => {
      const rMachine = createMockMachine();
      const customCookie = { name: "lang", path: "/", sameSite: "lax" as const };
      const strategy = new NextAppFlatStrategy(rMachine, {
        cookie: customCookie,
        basePath: "/docs",
      });

      expect(strategy.config.cookie).toBe(customCookie);
      expect(strategy.config.basePath).toBe("/docs");
      expect(strategy.config.pathMatcher).toBe(defaultPathMatcher);
      expect(strategy.config.localeKey).toBe("locale");
      expect(strategy.config.autoLocaleBinding).toBe("off");
    });

    it("applies all overrides when full config is provided", () => {
      const rMachine = createMockMachine();
      const customCookie = { name: "lang", path: "/", sameSite: "strict" as const };
      const customMatcher = /^\/app\//;
      const strategy = new NextAppFlatStrategy(rMachine, {
        cookie: customCookie,
        pathMatcher: customMatcher,
        localeKey: "lang",
        autoLocaleBinding: "on",
        basePath: "/app",
        PathAtlas: DynamicPathAtlas,
      });

      expect(strategy.config.cookie).toBe(customCookie);
      expect(strategy.config.pathMatcher).toBe(customMatcher);
      expect(strategy.config.localeKey).toBe("lang");
      expect(strategy.config.autoLocaleBinding).toBe("on");
      expect(strategy.config.basePath).toBe("/app");
      expect(strategy.config.PathAtlas).toBe(DynamicPathAtlas);
    });
  });

  // -----------------------------------------------------------------------
  // createClientToolset — inherited from NextAppStrategyCore
  // -----------------------------------------------------------------------

  describe("createClientToolset", () => {
    it("delegates to createNextAppClientToolset with rMachine", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppFlatStrategy(rMachine);
      mockCreateClientToolset.mockReturnValue({});

      await strategy.createClientToolset();

      expect(mockCreateClientToolset).toHaveBeenCalledOnce();
      expect(mockCreateClientToolset.mock.calls[0]![0]).toBe(rMachine);
    });

    it("returns the toolset produced by the factory", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppFlatStrategy(rMachine);
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
    it("delegates to createNextAppServerToolset with rMachine and NextClientRMachine", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppFlatStrategy(rMachine);
      const MockClientRMachine = vi.fn();
      mockCreateServerToolset.mockReturnValue({});

      await strategy.createServerToolset(MockClientRMachine as any);

      expect(mockCreateServerToolset).toHaveBeenCalledOnce();
      expect(mockCreateServerToolset.mock.calls[0]![0]).toBe(rMachine);
      expect(mockCreateServerToolset.mock.calls[0]![2]).toBe(MockClientRMachine);
    });

    it("returns the toolset produced by the factory", async () => {
      const rMachine = createMockMachine();
      const strategy = new NextAppFlatStrategy(rMachine);
      const MockClientRMachine = vi.fn();
      const expectedToolset = { getLocale: vi.fn() };
      mockCreateServerToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createServerToolset(MockClientRMachine as any);

      expect(result).toBe(expectedToolset);
    });
  });
});
