import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BuiltPathAtlas } from "#r-machine/next/core";
import type { NextAppClientImpl, NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type { NextAppServerImpl } from "../../../src/core/app/next-app-server-toolset.js";
import {
  DefaultPathAtlas,
  localeHeaderName,
  type NextAppStrategyConfig,
  NextAppStrategyCore,
} from "../../../src/core/app/next-app-strategy-core.js";
import type { TestLocale } from "../../_fixtures/constants.js";
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

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type TestConfig = NextAppStrategyConfig<
  TestAtlas,
  typeof NextAppStrategyCore.defaultConfig.clientKit,
  typeof NextAppStrategyCore.defaultConfig.serverKit,
  DefaultPathAtlas,
  "locale"
>;

function createTestStrategy() {
  const mockClientImpl: NextAppClientImpl<TestLocale> = {
    onLoad: undefined,
    writeLocale: vi.fn(),
    createPathComposer: vi.fn(() => () => "/"),
  };

  const mockServerImpl: NextAppServerImpl<TestLocale, "locale"> = {
    localeKey: "locale",
    autoLocaleBinding: false,
    writeLocale: vi.fn(),
    createLocaleStaticParamsGenerator: vi.fn(async () => async () => []),
    createProxy: vi.fn(async () => vi.fn()),
    createPathComposer: vi.fn(() => () => "/"),
  };

  class TestStrategy extends NextAppStrategyCore<TestAtlas, TestLocale, E, EF, TestConfig> {
    // biome-ignore lint/complexity/noUselessConstructor: widens the protected base ctor to public for tests
    constructor(machine: any, cfg: any) {
      super(machine, cfg);
    }

    protected readonly pathAtlas = {
      segment: {},
      containsTranslations: false,
    } as BuiltPathAtlas<DefaultPathAtlas>;

    protected async createClientImpl(): Promise<NextAppClientImpl<TestLocale>> {
      return mockClientImpl;
    }

    protected async createServerImpl(): Promise<NextAppServerImpl<TestLocale, "locale">> {
      return mockServerImpl;
    }
  }

  const rMachine = createMockMachine();
  const strategy = new TestStrategy(rMachine as never, NextAppStrategyCore.defaultConfig as TestConfig);

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

  it("has an empty segment property", () => {
    const atlas = new DefaultPathAtlas();
    expect(atlas.segment).toEqual({});
  });
});

describe("NextAppStrategyCore", () => {
  describe("defaultConfig", () => {
    it("has clientKit set to empty object", () => {
      expect(NextAppStrategyCore.defaultConfig.clientKit).toEqual({});
    });

    it("has serverKit set to empty object", () => {
      expect(NextAppStrategyCore.defaultConfig.serverKit).toEqual({});
    });

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

  // -----------------------------------------------------------------------
  // createClientToolset
  // -----------------------------------------------------------------------

  describe("createClientToolset", () => {
    it("delegates to createNextAppClientToolset with rMachine, clientKit, and client impl", async () => {
      const { strategy, rMachine, mockClientImpl } = createTestStrategy();
      mockCreateClientToolset.mockReturnValue({});

      await strategy.createClientToolset();

      expect(mockCreateClientToolset).toHaveBeenCalledOnce();
      expect(mockCreateClientToolset).toHaveBeenCalledWith(
        rMachine,
        NextAppStrategyCore.defaultConfig.clientKit,
        mockClientImpl
      );
    });

    it("returns the result of createNextAppClientToolset", async () => {
      const { strategy } = createTestStrategy();
      const expectedToolset = { NextClientRMachine: vi.fn() };
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
    it("delegates to createNextAppServerToolset with rMachine, serverKit, server impl, and NextClientRMachine", async () => {
      const { strategy, rMachine, mockServerImpl } = createTestStrategy();
      const MockNextClientRMachine = vi.fn() as unknown as NextAppClientRMachine<TestLocale>;
      mockCreateServerToolset.mockReturnValue({});

      await strategy.createServerToolset(MockNextClientRMachine);

      expect(mockCreateServerToolset).toHaveBeenCalledOnce();
      expect(mockCreateServerToolset).toHaveBeenCalledWith(
        rMachine,
        NextAppStrategyCore.defaultConfig.serverKit,
        mockServerImpl,
        MockNextClientRMachine
      );
    });

    it("returns the result of createNextAppServerToolset", async () => {
      const { strategy } = createTestStrategy();
      const MockNextClientRMachine = vi.fn() as unknown as NextAppClientRMachine<TestLocale>;
      const expectedToolset = { bindLocale: vi.fn() };
      mockCreateServerToolset.mockReturnValue(expectedToolset);

      const result = await strategy.createServerToolset(MockNextClientRMachine);

      expect(result).toBe(expectedToolset);
    });

    it("propagates rejection from createServerImpl", async () => {
      const { strategy } = createTestStrategy();
      const MockNextClientRMachine = vi.fn() as unknown as NextAppClientRMachine<TestLocale>;
      const implError = new Error("server impl failure");
      vi.spyOn(strategy as any, "createServerImpl").mockRejectedValue(implError);

      await expect(strategy.createServerToolset(MockNextClientRMachine)).rejects.toThrow("server impl failure");
    });
  });
});
