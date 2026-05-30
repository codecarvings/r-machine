import { defaultCookieDeclaration } from "r-machine/strategy/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextAppFlatStrategyCore } from "#r-machine/next/core/app/flat";
import { defaultPathMatcher } from "#r-machine/next/internal";
import { NextAppFlatStrategy } from "../../src/app/flat/next-app-flat-strategy.js";
import { DynamicPathAtlas } from "../_fixtures/_helpers.js";
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

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
});

// Structural helper: `config` and `rMachine` are protected — cast for assertions.
type ReadCfg = {
  cookie?: unknown;
  pathMatcher?: unknown;
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

describe("NextAppFlatStrategy", () => {
  // -----------------------------------------------------------------------
  // create — the factory unique to this class (defaults merging)
  // -----------------------------------------------------------------------

  describe("create", () => {
    it("applies all defaults when called with rMachine and empty params", () => {
      const rMachine = createMockMachine();
      const strategy = NextAppFlatStrategy.create(rMachine, {});

      expect(readRMachine(strategy)).toBe(rMachine);
      expect(readConfig(strategy).cookie).toBe(defaultCookieDeclaration);
      expect(readConfig(strategy).pathMatcher).toBe(defaultPathMatcher);
      expect(readConfig(strategy).localeKey).toBe("locale");
      expect(readConfig(strategy).autoLocaleBinding).toBe("off");
      expect(readConfig(strategy).basePath).toBe("");
    });

    it("preserves non-overridden defaults when partial config is provided", () => {
      const rMachine = createMockMachine();
      const customCookie = { name: "lang", path: "/", sameSite: "lax" as const };
      const strategy = NextAppFlatStrategy.create(rMachine, {
        cookie: customCookie,
        basePath: "/docs",
      });

      expect(readConfig(strategy).cookie).toBe(customCookie);
      expect(readConfig(strategy).basePath).toBe("/docs");
      expect(readConfig(strategy).pathMatcher).toBe(defaultPathMatcher);
      expect(readConfig(strategy).localeKey).toBe("locale");
      expect(readConfig(strategy).autoLocaleBinding).toBe("off");
    });

    it("applies all overrides when full params are provided", () => {
      const rMachine = createMockMachine();
      const customCookie = { name: "lang", path: "/", sameSite: "strict" as const };
      const customMatcher = /^\/app\//;
      const strategy = NextAppFlatStrategy.create(rMachine, {
        cookie: customCookie,
        pathMatcher: customMatcher,
        localeKey: "lang",
        autoLocaleBinding: "on",
        basePath: "/app",
        PathAtlas: DynamicPathAtlas,
      });

      expect(readConfig(strategy).cookie).toBe(customCookie);
      expect(readConfig(strategy).pathMatcher).toBe(customMatcher);
      expect(readConfig(strategy).localeKey).toBe("lang");
      expect(readConfig(strategy).autoLocaleBinding).toBe("on");
      expect(readConfig(strategy).basePath).toBe("/app");
      expect(readConfig(strategy).PathAtlas).toBe(DynamicPathAtlas);
    });

    it("produces a config that is not the same reference as defaultConfig", () => {
      const rMachine = createMockMachine();
      const strategy = NextAppFlatStrategy.create(rMachine, {});
      expect(readConfig(strategy)).not.toBe(NextAppFlatStrategyCore.defaultConfig);
    });

    it("does not mutate defaultConfig when providing overrides", () => {
      const customMatcher = /^\/custom\//;
      NextAppFlatStrategy.create(createMockMachine(), { pathMatcher: customMatcher });
      expect(NextAppFlatStrategyCore.defaultConfig.pathMatcher).toBe(defaultPathMatcher);
    });
  });

  // -----------------------------------------------------------------------
  // createClientToolset — inherited from NextAppStrategyCore
  // -----------------------------------------------------------------------

  describe("createClientToolset", () => {
    it("delegates to createNextAppClientToolset with rMachine and clientKit", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppFlatStrategy.create(rMachine, {});
      mockCreateClientToolset.mockReturnValue({});

      await strategy.createClientToolset();

      expect(mockCreateClientToolset).toHaveBeenCalledOnce();
      expect(mockCreateClientToolset.mock.calls[0]![0]).toBe(rMachine);
    });

    it("returns the toolset produced by the factory", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppFlatStrategy.create(rMachine, {});
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
      const strategy = NextAppFlatStrategy.create(rMachine, {});
      const MockClientRMachine = vi.fn();
      mockCreateServerToolset.mockReturnValue({});

      await strategy.createServerToolset(MockClientRMachine as any);

      expect(mockCreateServerToolset).toHaveBeenCalledOnce();
      expect(mockCreateServerToolset.mock.calls[0]![0]).toBe(rMachine);
      expect(mockCreateServerToolset.mock.calls[0]![3]).toBe(MockClientRMachine);
    });

    it("returns the toolset produced by the factory", async () => {
      const rMachine = createMockMachine();
      const strategy = NextAppFlatStrategy.create(rMachine, {});
      const MockClientRMachine = vi.fn();
      const expectedToolset = { getLocale: vi.fn() };
      mockCreateServerToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createServerToolset(MockClientRMachine as any);

      expect(result).toBe(expectedToolset);
    });
  });
});
