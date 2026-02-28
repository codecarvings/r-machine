import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError } from "r-machine/errors";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { Strategy } from "r-machine/strategy";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReactStandardStrategyCore } from "../../../src/core/react-standard-strategy-core.js";
import { ReactStandardStrategy } from "../../../src/lib/react-standard-strategy.js";
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

// ---------------------------------------------------------------------------
// ReactStandardStrategy
// ---------------------------------------------------------------------------

describe("ReactStandardStrategy", () => {
  // -----------------------------------------------------------------------
  // construction
  // -----------------------------------------------------------------------

  describe("construction", () => {
    it("extends ReactStandardStrategyCore", () => {
      const strategy = new ReactStandardStrategy(createMockRMachine());
      expect(strategy).toBeInstanceOf(ReactStandardStrategyCore);
    });

    it("extends Strategy", () => {
      const strategy = new ReactStandardStrategy(createMockRMachine());
      expect(strategy).toBeInstanceOf(Strategy);
    });

    it("can be instantiated with only an RMachine (no config argument)", () => {
      const strategy = new ReactStandardStrategy(createMockRMachine());
      expect(strategy).toBeInstanceOf(ReactStandardStrategy);
    });

    it("can be instantiated with an RMachine and a partial config", () => {
      const detector: CustomLocaleDetector = () => "en";
      const strategy = new ReactStandardStrategy(createMockRMachine(), { localeDetector: detector });
      expect(strategy).toBeInstanceOf(ReactStandardStrategy);
    });

    it("can be instantiated with an RMachine and an empty config", () => {
      const strategy = new ReactStandardStrategy(createMockRMachine(), {});
      expect(strategy).toBeInstanceOf(ReactStandardStrategy);
    });

    it("exposes the rMachine property from the base class", () => {
      const machine = createMockRMachine();
      const strategy = new ReactStandardStrategy(machine);
      expect(strategy.rMachine).toBe(machine);
    });
  });

  // -----------------------------------------------------------------------
  // config merging with defaultConfig
  // -----------------------------------------------------------------------

  describe("config merging with defaultConfig", () => {
    it("defaults both fields to undefined when no config is provided", () => {
      const strategy = new ReactStandardStrategy(createMockRMachine());
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("defaults both fields to undefined when an empty config is provided", () => {
      const strategy = new ReactStandardStrategy(createMockRMachine(), {});
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("applies localeDetector while defaulting localeStore to undefined", () => {
      const detector: CustomLocaleDetector = () => "it";
      const strategy = new ReactStandardStrategy(createMockRMachine(), { localeDetector: detector });
      expect(strategy.config.localeDetector).toBe(detector);
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("applies localeStore while defaulting localeDetector to undefined", () => {
      const store = syncStore("en");
      const strategy = new ReactStandardStrategy(createMockRMachine(), { localeStore: store });
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBe(store);
    });

    it("applies both fields when both are provided", () => {
      const detector: CustomLocaleDetector = () => "it";
      const store = syncStore("en");
      const strategy = new ReactStandardStrategy(createMockRMachine(), {
        localeDetector: detector,
        localeStore: store,
      });
      expect(strategy.config.localeDetector).toBe(detector);
      expect(strategy.config.localeStore).toBe(store);
    });

    it("user-provided values override defaultConfig (not the other way around)", () => {
      const detector: CustomLocaleDetector = () => "it";
      const strategy = new ReactStandardStrategy(createMockRMachine(), { localeDetector: detector });
      expect(strategy.config.localeDetector).toBe(detector);
    });

    it("produces a config that is not the same reference as defaultConfig", () => {
      const strategy = new ReactStandardStrategy(createMockRMachine());
      expect(strategy.config).not.toBe(ReactStandardStrategyCore.defaultConfig);
    });

    it("does not mutate defaultConfig when providing overrides", () => {
      const detector: CustomLocaleDetector = () => "it";
      new ReactStandardStrategy(createMockRMachine(), { localeDetector: detector });
      expect(ReactStandardStrategyCore.defaultConfig.localeDetector).toBeUndefined();
      expect(ReactStandardStrategyCore.defaultConfig.localeStore).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — partial config wiring
  // -----------------------------------------------------------------------

  describe("createToolset — partial config wiring", () => {
    it("falls back to rMachine.config.defaultLocale when constructed without config", async () => {
      const machine = createMockRMachine({ defaultLocale: "it" });
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
      const strategy = new ReactStandardStrategy(createMockRMachine(), {
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
      const strategy = new ReactStandardStrategy(createMockRMachine(), { localeStore: store });
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
      const strategy = new ReactStandardStrategy(createMockRMachine(), { localeStore: store });
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

  // -----------------------------------------------------------------------
  // createToolset — full integration through partial config
  // -----------------------------------------------------------------------

  describe("createToolset — full integration through partial config", () => {
    it("detector → store → render → setLocale → store.set", async () => {
      const store = syncStore(undefined);
      const machine = createMockRMachine({
        hybridPickR: (locale) => ({ greeting: locale === "en" ? "hello" : "ciao" }),
      });
      const strategy = new ReactStandardStrategy(machine, {
        localeStore: store,
        localeDetector: () => "en",
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

    it("produces independent toolsets on repeated calls", async () => {
      const strategy = new ReactStandardStrategy(createMockRMachine());
      const toolset1 = await strategy.createToolset();
      const toolset2 = await strategy.createToolset();

      expect(toolset1).not.toBe(toolset2);
    });
  });
});
