import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { CustomLocaleDetector } from "r-machine/strategy";
import { Strategy } from "r-machine/strategy";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ReactStandardStrategyCore } from "#r-machine/react/core";
import { ReactStandardStrategy } from "../../../src/lib/react-standard-strategy.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";
import { syncStore } from "../_fixtures/mock-strategy-config.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// ReactStandardStrategy
// ---------------------------------------------------------------------------

describe("ReactStandardStrategy", () => {
  // -----------------------------------------------------------------------
  // construction
  // -----------------------------------------------------------------------

  describe("construction", () => {
    it("extends ReactStandardStrategyCore", () => {
      const strategy = new ReactStandardStrategy(createMockMachine());
      expect(strategy).toBeInstanceOf(ReactStandardStrategyCore);
    });

    it("extends Strategy", () => {
      const strategy = new ReactStandardStrategy(createMockMachine());
      expect(strategy).toBeInstanceOf(Strategy);
    });

    it("can be instantiated with only an RMachine (no config argument)", () => {
      const strategy = new ReactStandardStrategy(createMockMachine());
      expect(strategy).toBeInstanceOf(ReactStandardStrategy);
    });

    it("can be instantiated with an RMachine and a partial config", () => {
      const detector: CustomLocaleDetector = () => "en";
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeDetector: detector });
      expect(strategy).toBeInstanceOf(ReactStandardStrategy);
    });

    it("can be instantiated with an RMachine and an empty config", () => {
      const strategy = new ReactStandardStrategy(createMockMachine(), {});
      expect(strategy).toBeInstanceOf(ReactStandardStrategy);
    });

    it("exposes the rMachine property from the base class", () => {
      const machine = createMockMachine();
      const strategy = new ReactStandardStrategy(machine);
      expect(strategy.rMachine).toBe(machine);
    });
  });

  // -----------------------------------------------------------------------
  // config merging with defaultConfig
  // -----------------------------------------------------------------------

  describe("config merging with defaultConfig", () => {
    it("defaults both fields to undefined when no config is provided", () => {
      const strategy = new ReactStandardStrategy(createMockMachine());
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("defaults both fields to undefined when an empty config is provided", () => {
      const strategy = new ReactStandardStrategy(createMockMachine(), {});
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("applies localeDetector while defaulting localeStore to undefined", () => {
      const detector: CustomLocaleDetector = () => "it";
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeDetector: detector });
      expect(strategy.config.localeDetector).toBe(detector);
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("applies localeStore while defaulting localeDetector to undefined", () => {
      const store = syncStore("en");
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeStore: store });
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBe(store);
    });

    it("applies both fields when both are provided", () => {
      const detector: CustomLocaleDetector = () => "it";
      const store = syncStore("en");
      const strategy = new ReactStandardStrategy(createMockMachine(), {
        localeDetector: detector,
        localeStore: store,
      });
      expect(strategy.config.localeDetector).toBe(detector);
      expect(strategy.config.localeStore).toBe(store);
    });

    it("user-provided values override defaultConfig (not the other way around)", () => {
      const detector: CustomLocaleDetector = () => "it";
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeDetector: detector });
      expect(strategy.config.localeDetector).toBe(detector);
    });

    it("produces a config that is not the same reference as defaultConfig", () => {
      const strategy = new ReactStandardStrategy(createMockMachine());
      expect(strategy.config).not.toBe(ReactStandardStrategyCore.defaultConfig);
    });

    it("does not mutate defaultConfig when providing overrides", () => {
      const detector: CustomLocaleDetector = () => "it";
      new ReactStandardStrategy(createMockMachine(), { localeDetector: detector });
      expect(ReactStandardStrategyCore.defaultConfig.localeDetector).toBeUndefined();
      expect(ReactStandardStrategyCore.defaultConfig.localeStore).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — partial config wiring
  // -----------------------------------------------------------------------

  describe("createToolset — partial config wiring", () => {
    it("falls back to rMachine.config.defaultLocale when constructed without config", async () => {
      const machine = createMockMachine({ defaultLocale: "it" });
      const strategy = new ReactStandardStrategy(machine);
      const toolset = await strategy.createToolset();

      function LocaleDisplay() {
        return <span data-testid="locale">{toolset.useLocale()}</span>;
      }

      render(
        <toolset.ReactRMachine>
          <LocaleDisplay />
        </toolset.ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });

    it("uses localeDetector from partial config to determine the initial locale", async () => {
      const strategy = new ReactStandardStrategy(createMockMachine(), {
        localeDetector: () => "it",
      });
      const toolset = await strategy.createToolset();

      function LocaleDisplay() {
        return <span data-testid="locale">{toolset.useLocale()}</span>;
      }

      render(
        <toolset.ReactRMachine>
          <LocaleDisplay />
        </toolset.ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });

    it("uses localeStore from partial config to read the initial locale", async () => {
      const store = syncStore("it");
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeStore: store });
      const toolset = await strategy.createToolset();

      function LocaleDisplay() {
        return <span data-testid="locale">{toolset.useLocale()}</span>;
      }

      render(
        <toolset.ReactRMachine>
          <LocaleDisplay />
        </toolset.ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });

    it("delegates locale writes to the localeStore from partial config", async () => {
      const store = syncStore("en");
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeStore: store });
      const toolset = await strategy.createToolset();

      const { result } = renderHook(() => toolset.useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <toolset.ReactRMachine>{children}</toolset.ReactRMachine>,
      });

      await act(async () => {
        await result.current("it");
      });

      expect(store.set).toHaveBeenCalledWith("it");
    });
  });
});
