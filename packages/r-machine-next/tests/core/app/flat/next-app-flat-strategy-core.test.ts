import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { defaultPathMatcher } from "#r-machine/next/internal";
import {
  type NextAppFlatStrategyConfig,
  NextAppFlatStrategyCore,
} from "../../../../src/core/app/flat/next-app-flat-strategy-core.js";
import { DynamicPathAtlas, SimplePathAtlas } from "../../../_fixtures/_helpers.js";
import { TEST_DEFAULT_LOCALE as defaultLocale, type TestLocale } from "../../../_fixtures/constants.js";
import { createMockMachine, type TestAtlas } from "../../../_fixtures/mock-machine.js";

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

type CKM = typeof NextAppFlatStrategyCore.defaultConfig.clientKit;
type SKM = typeof NextAppFlatStrategyCore.defaultConfig.serverKit;
type EF = ExperimentalFlags;
type SimpleConfig = NextAppFlatStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">;
type DynamicConfig = NextAppFlatStrategyConfig<TestAtlas, CKM, SKM, DynamicPathAtlas, "locale">;

function createTestConfig(overrides?: Partial<SimpleConfig>): SimpleConfig {
  return {
    ...NextAppFlatStrategyCore.defaultConfig,
    PathAtlas: SimplePathAtlas,
    ...overrides,
  } as SimpleConfig;
}

function createTestStrategy(configOverrides?: Partial<SimpleConfig>) {
  const config = createTestConfig(configOverrides);

  class TestFlatStrategy extends NextAppFlatStrategyCore<
    TestAtlas,
    TestLocale,
    ResEquipment<TestAtlas>,
    EF,
    SimpleConfig
  > {
    // biome-ignore lint/complexity/noUselessConstructor: widens the protected base ctor to public for tests
    constructor(machine: any, cfg: any) {
      super(machine, cfg);
    }
  }

  const rMachine = createMockMachine();
  const strategy = new TestFlatStrategy(rMachine, config);

  return { strategy, rMachine, config };
}

function createDynamicStrategy() {
  const config: DynamicConfig = {
    PathAtlas: DynamicPathAtlas,
    localeKey: "locale",
    autoLocaleBinding: "off",
    basePath: "",
    clientKit: {} as CKM,
    serverKit: {} as SKM,
    cookie: defaultCookieDeclaration,
    pathMatcher: defaultPathMatcher,
  } as DynamicConfig;

  class TestFlatStrategy extends NextAppFlatStrategyCore<
    TestAtlas,
    TestLocale,
    ResEquipment<TestAtlas>,
    EF,
    DynamicConfig
  > {
    // biome-ignore lint/complexity/noUselessConstructor: widens the protected base ctor to public for tests
    constructor(machine: any, cfg: any) {
      super(machine, cfg);
    }
  }

  const rMachine = createMockMachine();
  return new TestFlatStrategy(rMachine, config);
}

function createDynamicStrategyWithLocale(overrideDefaultLocale: TestLocale) {
  const config: DynamicConfig = {
    PathAtlas: DynamicPathAtlas,
    localeKey: "locale",
    autoLocaleBinding: "off",
    basePath: "",
    clientKit: {} as CKM,
    serverKit: {} as SKM,
    cookie: defaultCookieDeclaration,
    pathMatcher: defaultPathMatcher,
  } as DynamicConfig;

  class TestFlatStrategy extends NextAppFlatStrategyCore<
    TestAtlas,
    TestLocale,
    ResEquipment<TestAtlas>,
    EF,
    DynamicConfig
  > {
    // biome-ignore lint/complexity/noUselessConstructor: widens the protected base ctor to public for tests
    constructor(machine: any, cfg: any) {
      super(machine, cfg);
    }
  }

  const rMachine = createMockMachine({ defaultLocale: overrideDefaultLocale });
  return new TestFlatStrategy(rMachine, config);
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

describe("NextAppFlatStrategyCore", () => {
  describe("defaultConfig", () => {
    it("defaults to the standard cookie declaration", () => {
      expect(NextAppFlatStrategyCore.defaultConfig.cookie).toBe(defaultCookieDeclaration);
    });

    it("defaults to the standard path matcher", () => {
      expect(NextAppFlatStrategyCore.defaultConfig.pathMatcher).toBe(defaultPathMatcher);
    });
  });

  describe("protected members initialization", () => {
    it("instantiates the path atlas from config", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathAtlas).toBeDefined();
      expect((strategy as any).pathAtlas.segment).toEqual({});
    });

    it("initializes an HrefTranslator for path translation", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathTranslator).toBeInstanceOf(HrefTranslator);
    });

    it("initializes an HrefCanonicalizer for path canonicalization", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).pathCanonicalizer).toBeInstanceOf(HrefCanonicalizer);
    });

    it("derives defaultLocale from the rMachine configuration", () => {
      const { strategy } = createTestStrategy();
      expect((strategy as any).defaultLocale).toBe(defaultLocale);
    });
  });

  // -----------------------------------------------------------------------
  // createClientImpl
  // -----------------------------------------------------------------------

  describe("createClientImpl", () => {
    it("creates a client impl that translates declared paths", async () => {
      const strategy = createDynamicStrategy();
      const impl = await (strategy as any).createClientImpl();
      const composePath = impl.createPathComposer("en");

      expect(composePath("/about")).toBe("/about");
      expect(composePath("/products/[id]", { id: "42" })).toBe("/products/42");
    });
  });

  // -----------------------------------------------------------------------
  // createServerImpl
  // -----------------------------------------------------------------------

  describe("createServerImpl", () => {
    it("creates a server impl that preserves the configured localeKey", async () => {
      const strategy = createDynamicStrategy();
      const impl = await (strategy as any).createServerImpl();

      expect(impl.localeKey).toBe("locale");
    });
  });

  // -----------------------------------------------------------------------
  // getHelpers
  // -----------------------------------------------------------------------

  describe("getHelpers", () => {
    it("includes the strategy's hrefHelper and memoizes the result across calls", () => {
      const strategy = createDynamicStrategy();

      const helpers = strategy.getHelpers();
      expect(helpers.hrefHelper).toBe((strategy as any).hrefHelper);
      // Second call returns the cached object (no rebuild).
      expect(strategy.getHelpers()).toBe(helpers);
    });
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    describe("getPath", () => {
      it("resolves declared paths using the default locale", () => {
        const strategy = createDynamicStrategy();

        expect((strategy as any).hrefHelper.getPath("/about")).toBe("/about");
      });

      it("translates paths for default locale", () => {
        const strategy = createDynamicStrategy();

        expect((strategy as any).hrefHelper.getPath("/")).toBe("/");
        expect((strategy as any).hrefHelper.getPath("/about")).toBe("/about");
        expect((strategy as any).hrefHelper.getPath("/products")).toBe("/products");
      });

      it("substitutes dynamic segment params in paths", () => {
        const strategy = createDynamicStrategy();

        expect((strategy as any).hrefHelper.getPath("/products/[id]", { id: "42" })).toBe("/products/42");
      });

      it("returns canonical paths regardless of which locale is set as default", () => {
        const strategy = createDynamicStrategyWithLocale("it");

        expect((strategy as any).hrefHelper.getPath("/about")).toBe("/about");
        expect((strategy as any).hrefHelper.getPath("/products/[id]", { id: "7" })).toBe("/products/7");
      });

      it("returns undeclared paths as-is", () => {
        const strategy = createDynamicStrategy();
        const getPath = (strategy as any).hrefHelper.getPath as (path: string) => string;

        expect(getPath("/unknown-page")).toBe("/unknown-page");
        expect(getPath("/deeply/nested/unknown")).toBe("/deeply/nested/unknown");
      });
    });
  });
});
