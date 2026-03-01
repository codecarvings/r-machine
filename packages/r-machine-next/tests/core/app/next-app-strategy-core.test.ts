import type { RMachine } from "r-machine";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExtendedPathAtlas } from "#r-machine/next/core";
import type { NextAppClientImpl, NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type { NextAppServerImpl } from "../../../src/core/app/next-app-server-toolset.js";
import {
  DefaultPathAtlas,
  localeHeaderName,
  type NextAppStrategyConfig,
  NextAppStrategyCore,
} from "../../../src/core/app/next-app-strategy-core.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";
import { createMockMachine } from "../../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreateClientToolset = vi.fn();
const mockCreateServerToolset = vi.fn();

vi.mock("../../../src/core/app/next-app-client-toolset.js", () => ({
  createNextAppClientToolset: (...args: unknown[]) => mockCreateClientToolset(...args),
}));

vi.mock("../../../src/core/app/next-app-server-toolset.js", () => ({
  createNextAppServerToolset: (...args: unknown[]) => mockCreateServerToolset(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TestConfig = NextAppStrategyConfig<DefaultPathAtlas, "locale">;

function createTestStrategy() {
  const mockClientImpl: NextAppClientImpl = {
    onLoad: undefined,
    writeLocale: vi.fn(),
    createUsePathComposer: vi.fn(() => () => vi.fn(() => "/")),
  };

  const mockServerImpl: NextAppServerImpl = {
    localeKey: "locale",
    autoLocaleBinding: false,
    writeLocale: vi.fn(),
    createLocaleStaticParamsGenerator: vi.fn(async () => async () => []),
    createProxy: vi.fn(async () => vi.fn()),
    createBoundPathComposerSupplier: vi.fn(async () => async () => vi.fn(() => "/")),
  };

  class TestStrategy extends NextAppStrategyCore<TestAtlas, TestConfig> {
    protected readonly pathAtlas = {
      decl: {},
      containsTranslations: false,
    } as ExtendedPathAtlas<DefaultPathAtlas>;

    protected async createClientImpl(): Promise<NextAppClientImpl> {
      return mockClientImpl;
    }

    protected async createServerImpl(): Promise<NextAppServerImpl> {
      return mockServerImpl;
    }
  }

  const rMachine = createMockMachine() as unknown as RMachine<TestAtlas>;
  const strategy = new TestStrategy(
    rMachine,
    NextAppStrategyCore.defaultConfig as TestConfig
  );

  return { strategy, rMachine, mockClientImpl, mockServerImpl };
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

describe("localeHeaderName", () => {
  it("equals 'x-rm-locale'", () => {
    expect(localeHeaderName).toBe("x-rm-locale");
  });
});

describe("DefaultPathAtlas", () => {
  it("can be instantiated", () => {
    const atlas = new DefaultPathAtlas();
    expect(atlas).toBeInstanceOf(DefaultPathAtlas);
  });

  it("has an empty decl property", () => {
    const atlas = new DefaultPathAtlas();
    expect(atlas.decl).toEqual({});
  });
});

describe("NextAppStrategyCore", () => {
  describe("defaultConfig", () => {
    it("has PathAtlas set to DefaultPathAtlas", () => {
      expect(NextAppStrategyCore.defaultConfig.PathAtlas).toBe(DefaultPathAtlas);
    });

    it("has localeKey set to 'locale'", () => {
      expect(NextAppStrategyCore.defaultConfig.localeKey).toBe("locale");
    });

    it("has autoLocaleBinding set to 'off'", () => {
      expect(NextAppStrategyCore.defaultConfig.autoLocaleBinding).toBe("off");
    });

    it("has basePath set to empty string", () => {
      expect(NextAppStrategyCore.defaultConfig.basePath).toBe("");
    });
  });

  it("stores rMachine and config from constructor", () => {
    const { strategy, rMachine } = createTestStrategy();

    expect(strategy.rMachine).toBe(rMachine);
    expect(strategy.config).toBe(NextAppStrategyCore.defaultConfig);
  });

  // -----------------------------------------------------------------------
  // createClientToolset
  // -----------------------------------------------------------------------

  describe("createClientToolset", () => {
    it("delegates to createNextAppClientToolset with rMachine and client impl", async () => {
      const { strategy, mockClientImpl } = createTestStrategy();
      mockCreateClientToolset.mockReturnValue({});

      await strategy.createClientToolset();

      expect(mockCreateClientToolset).toHaveBeenCalledOnce();
      expect(mockCreateClientToolset).toHaveBeenCalledWith(strategy.rMachine, mockClientImpl);
    });

    it("returns the result of createNextAppClientToolset", async () => {
      const { strategy } = createTestStrategy();
      const expectedToolset = { useLocale: vi.fn() };
      mockCreateClientToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createClientToolset();

      expect(result).toBe(expectedToolset);
    });

    it("propagates rejection from createClientImpl", async () => {
      const { strategy } = createTestStrategy();
      const implError = new Error("client impl failure");
      vi.spyOn(strategy as any, "createClientImpl").mockRejectedValue(implError);

      await expect(strategy.createClientToolset()).rejects.toThrow("client impl failure");
    });
  });

  // -----------------------------------------------------------------------
  // createServerToolset
  // -----------------------------------------------------------------------

  describe("createServerToolset", () => {
    it("delegates to createNextAppServerToolset with rMachine, server impl, and NextClientRMachine", async () => {
      const { strategy, mockServerImpl } = createTestStrategy();
      const MockNextClientRMachine = vi.fn() as unknown as NextAppClientRMachine;
      mockCreateServerToolset.mockReturnValue({});

      await strategy.createServerToolset(MockNextClientRMachine);

      expect(mockCreateServerToolset).toHaveBeenCalledOnce();
      expect(mockCreateServerToolset).toHaveBeenCalledWith(strategy.rMachine, mockServerImpl, MockNextClientRMachine);
    });

    it("returns the result of createNextAppServerToolset", async () => {
      const { strategy } = createTestStrategy();
      const MockNextClientRMachine = vi.fn() as unknown as NextAppClientRMachine;
      const expectedToolset = { getLocale: vi.fn() };
      mockCreateServerToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createServerToolset(MockNextClientRMachine);

      expect(result).toBe(expectedToolset);
    });

    it("propagates rejection from createServerImpl", async () => {
      const { strategy } = createTestStrategy();
      const MockNextClientRMachine = vi.fn() as unknown as NextAppClientRMachine;
      const implError = new Error("server impl failure");
      vi.spyOn(strategy as any, "createServerImpl").mockRejectedValue(implError);

      await expect(strategy.createServerToolset(MockNextClientRMachine)).rejects.toThrow("server impl failure");
    });
  });
});
