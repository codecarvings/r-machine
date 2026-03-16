import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { CustomLocaleDetector } from "r-machine/strategy";
import type { ReactNode } from "react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type ReactStandardStrategyConfig,
  ReactStandardStrategyCore,
} from "../../src/core/react-standard-strategy-core.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";
import { configWith, syncStore } from "../_fixtures/mock-strategy-config.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

class ConcreteStandardStrategy extends ReactStandardStrategyCore<TestAtlas, AnyLocale> {}

function createStrategy(
  options: { machine?: RMachine<TestAtlas, AnyLocale>; config?: ReactStandardStrategyConfig } = {}
) {
  const machine = options.machine ?? createMockMachine();
  const config = options.config ?? configWith();
  return { strategy: new ConcreteStandardStrategy(machine, config), machine };
}

// ---------------------------------------------------------------------------
// ReactStandardStrategyCore
// ---------------------------------------------------------------------------

describe("ReactStandardStrategyCore", () => {
  // -----------------------------------------------------------------------
  // construction
  // -----------------------------------------------------------------------

  describe("construction", () => {
    it("exposes the rMachine property from the base class", () => {
      const machine = createMockMachine();
      const { strategy } = createStrategy({ machine });
      expect(strategy.rMachine).toBe(machine);
    });

    it("exposes the config property from the base class", () => {
      const config = configWith({ localeDetector: () => "it" });
      const { strategy } = createStrategy({ config });
      expect(strategy.config).toBe(config);
    });
  });

  // -----------------------------------------------------------------------
  // defaultConfig
  // -----------------------------------------------------------------------

  describe("defaultConfig", () => {
    it("has localeDetector set to undefined", () => {
      expect(ReactStandardStrategyCore.defaultConfig.localeDetector).toBeUndefined();
    });

    it("has localeStore set to undefined", () => {
      expect(ReactStandardStrategyCore.defaultConfig.localeStore).toBeUndefined();
    });

    it("is the same reference when accessed from a subclass", () => {
      expect(ConcreteStandardStrategy.defaultConfig).toBe(ReactStandardStrategyCore.defaultConfig);
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — config wiring
  // -----------------------------------------------------------------------

  describe("createToolset — config wiring", () => {
    it("falls back to rMachine.config.defaultLocale when no detector or store is configured", async () => {
      const machine = createMockMachine({ defaultLocale: "it" });
      const { strategy } = createStrategy({ machine, config: configWith() });
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

    it("uses localeDetector from the config to determine the initial locale", async () => {
      const localeDetector: CustomLocaleDetector = () => "it";
      const { strategy } = createStrategy({
        config: configWith({ localeDetector }),
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

    it("uses localeStore from the config to read the initial locale", async () => {
      const store = syncStore("it");
      const { strategy } = createStrategy({
        config: configWith({ localeStore: store }),
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

    it("delegates locale writes to the localeStore from the config", async () => {
      const store = syncStore("en");
      const { strategy } = createStrategy({
        config: configWith({ localeStore: store }),
      });
      const toolset = await strategy.createToolset();

      const { result } = renderHook(() => toolset.useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <toolset.ReactRMachine>{children}</toolset.ReactRMachine>,
      });

      await act(async () => {
        await result.current("it");
      });

      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("localeStore takes priority over localeDetector when store has a value", async () => {
      const localeDetector = vi.fn(() => "en");
      const store = syncStore("it");
      const { strategy } = createStrategy({
        config: configWith({ localeStore: store, localeDetector }),
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
      expect(localeDetector).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — rMachine forwarding
  // -----------------------------------------------------------------------

  describe("createToolset — rMachine forwarding", () => {
    it("forwards the strategy rMachine to the toolset for resource resolution", async () => {
      const machine = createMockMachine();
      const { strategy } = createStrategy({ machine });
      const toolset = await strategy.createToolset();

      function ResourceConsumer() {
        const r = toolset.useR("common");
        return <div data-testid="greeting">{r.greeting}</div>;
      }

      await act(async () => {
        render(
          <toolset.ReactRMachine Suspense={React.Suspense} fallback={<div>loading</div>}>
            <ResourceConsumer />
          </toolset.ReactRMachine>
        );
      });

      expect((machine as any).hybridPickR).toHaveBeenCalled();
    });

    it("validates detected locale through rMachine.localeHelper", async () => {
      const machine = createMockMachine();
      const localeDetector: CustomLocaleDetector = () => "it";
      const { strategy } = createStrategy({
        machine,
        config: configWith({ localeDetector }),
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

      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("it");
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — async localeDetector
  // -----------------------------------------------------------------------

  describe("createToolset — async localeDetector", () => {
    it("supports async localeDetector through Suspense", async () => {
      let resolveLocale!: (locale: string) => void;
      const localePromise = new Promise<string>((r) => {
        resolveLocale = r;
      });
      const localeDetector: CustomLocaleDetector = () => localePromise;
      const { strategy } = createStrategy({
        config: configWith({ localeDetector }),
      });
      const toolset = await strategy.createToolset();

      function LocaleDisplay() {
        return <span data-testid="locale">{toolset.useLocale()}</span>;
      }

      await act(async () => {
        render(
          <toolset.ReactRMachine Suspense={React.Suspense} fallback={<div>loading...</div>}>
            <LocaleDisplay />
          </toolset.ReactRMachine>
        );
      });

      screen.getByText("loading...");
      expect(screen.queryByTestId("locale")).toBeNull();

      await act(async () => {
        resolveLocale("it");
        await localePromise;
      });

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — full integration
  // -----------------------------------------------------------------------

  describe("createToolset — full integration", () => {
    it("detector → store → render → setLocale → store.set", async () => {
      const store = syncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => "en";
      const machine = createMockMachine({
        hybridPickR: (locale) => ({ greeting: locale === "en" ? "hello" : "ciao" }),
      });
      const { strategy } = createStrategy({
        machine,
        config: configWith({ localeStore: store, localeDetector }),
      });
      const { ReactRMachine, useR, useLocale, useSetLocale } = await strategy.createToolset();

      function App() {
        const locale = useLocale();
        const r = useR("common");
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="locale">{locale}</span>
            <span data-testid="greeting">{r.greeting}</span>
            <button type="button" onClick={() => setLocale("it")}>
              switch
            </button>
          </>
        );
      }

      render(
        <ReactRMachine>
          <App />
        </ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("en");
      expect(screen.getByTestId("greeting").textContent).toBe("hello");
      expect(store.set).toHaveBeenCalledWith("en");

      await act(async () => {
        screen.getByText("switch").click();
      });

      expect(screen.getByTestId("locale").textContent).toBe("it");
      expect(screen.getByTestId("greeting").textContent).toBe("ciao");
      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("store.get → render → setLocale → store.set", async () => {
      const store = syncStore("en");
      const machine = createMockMachine({
        hybridPickR: (locale) => ({ greeting: locale === "en" ? "hello" : "ciao" }),
      });
      const { strategy } = createStrategy({
        machine,
        config: configWith({ localeStore: store }),
      });
      const { ReactRMachine, useR, useLocale, useSetLocale } = await strategy.createToolset();

      function App() {
        const locale = useLocale();
        const r = useR("common");
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="locale">{locale}</span>
            <span data-testid="greeting">{r.greeting}</span>
            <button type="button" onClick={() => setLocale("it")}>
              switch
            </button>
          </>
        );
      }

      render(
        <ReactRMachine>
          <App />
        </ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("en");
      expect(screen.getByTestId("greeting").textContent).toBe("hello");

      await act(async () => {
        screen.getByText("switch").click();
      });

      expect(screen.getByTestId("locale").textContent).toBe("it");
      expect(screen.getByTestId("greeting").textContent).toBe("ciao");
      expect(store.set).toHaveBeenCalledWith("it");
    });
  });
});
