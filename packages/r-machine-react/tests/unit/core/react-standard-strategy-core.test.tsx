import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError } from "r-machine/errors";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { Strategy } from "r-machine/strategy";
import type { ReactNode } from "react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type ReactStandardStrategyConfig,
  ReactStandardStrategyCore,
} from "../../../src/core/react-standard-strategy-core.js";
import type { TestAtlas } from "../../helpers/mock-machine.js";
import { VALID_LOCALES } from "../../helpers/mock-machine.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockRMachine(
  overrides: { defaultLocale?: string; hybridPickR?: (locale: string, namespace: string) => unknown } = {}
) {
  return {
    config: { defaultLocale: overrides.defaultLocale ?? "en" },
    localeHelper: {
      validateLocale: vi.fn((locale: string) =>
        VALID_LOCALES.has(locale)
          ? null
          : new RMachineConfigError(
              ERR_UNKNOWN_LOCALE,
              `Locale "${locale}" is invalid or is not in the list of locales.`
            )
      ),
    },
    hybridPickR: vi.fn(overrides.hybridPickR ?? (() => ({ greeting: "hello" }))),
    hybridPickRKit: vi.fn(() => [{ greeting: "hello" }, { home: "Home" }]),
  } as unknown as RMachine<TestAtlas>;
}

class ConcreteStandardStrategy extends ReactStandardStrategyCore<TestAtlas> {}

function configWith(overrides: Partial<ReactStandardStrategyConfig> = {}): ReactStandardStrategyConfig {
  return {
    localeDetector: undefined,
    localeStore: undefined,
    ...overrides,
  };
}

function syncStore(initial?: string): CustomLocaleStore & { value: string | undefined } {
  const store = {
    value: initial,
    get: vi.fn(() => store.value),
    set: vi.fn((locale: string) => {
      store.value = locale;
    }),
  };
  return store;
}

function createStrategy(options: { machine?: RMachine<TestAtlas>; config?: ReactStandardStrategyConfig } = {}) {
  const machine = options.machine ?? createMockRMachine();
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
    it("extends Strategy", () => {
      const { strategy } = createStrategy();
      expect(strategy).toBeInstanceOf(Strategy);
    });

    it("exposes the rMachine property from the base class", () => {
      const machine = createMockRMachine();
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
      const machine = createMockRMachine({ defaultLocale: "it" });
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
      const machine = createMockRMachine();
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
      const machine = createMockRMachine();
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
      const machine = createMockRMachine({
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
      const machine = createMockRMachine({
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

    it("produces independent toolsets on repeated calls", async () => {
      const { strategy } = createStrategy();
      const toolset1 = await strategy.createToolset();
      const toolset2 = await strategy.createToolset();

      expect(toolset1).not.toBe(toolset2);
    });
  });
});
