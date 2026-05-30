import { act, cleanup, render, screen } from "@testing-library/react";
import type { RMachine } from "r-machine";
import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import { RMachineError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type ReactStandardStrategyConfig,
  ReactStandardStrategyCore,
} from "../../src/core/react-standard-strategy-core.js";
import { createMockMachine, spies, type TestAtlas } from "../_fixtures/mock-machine.js";
import { configWith, syncStore } from "../_fixtures/mock-strategy-config.js";

afterEach(cleanup);

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type Cfg = ReactStandardStrategyConfig<TestAtlas, {}>;

// createImpl is already implemented by ReactStandardStrategyCore; the explicit
// public constructor just surfaces the (otherwise protected) base ctor for the
// test instantiations.
class ConcreteStandardStrategy extends ReactStandardStrategyCore<TestAtlas, AnyLocale, E, EF, Cfg> {
  // biome-ignore lint/complexity/noUselessConstructor: surfaces the protected base ctor as public for `new` in tests
  constructor(rMachine: RMachine<TestAtlas, AnyLocale, E, EF>, config: Cfg) {
    super(rMachine, config);
  }
}

function createStrategy(options: { machine?: RMachine<TestAtlas, AnyLocale, E, EF>; config?: Cfg } = {}) {
  const machine = options.machine ?? (createMockMachine() as never);
  const config = options.config ?? (configWith() as never);
  return { strategy: new ConcreteStandardStrategy(machine, config), machine };
}

// Renders a probe (locale + optional greeting + captured setLocale) inside the
// enhanced provider and settles the resource wire.
async function renderApp(
  toolset: Awaited<ReturnType<ConcreteStandardStrategy["createToolset"]>>,
  captureSetLocale?: (fn: (l: string) => Promise<void>) => void
) {
  function App() {
    const [common, $] = (
      toolset.Plug as unknown as (...a: unknown[]) => {
        useR: () => [{ greeting: string }, { locale: string; setLocale: (l: string) => Promise<void> }];
      }
    )("common").useR();
    captureSetLocale?.($.setLocale);
    return (
      <>
        <span data-testid="locale">{$.locale}</span>
        <span data-testid="greeting">{common.greeting}</span>
        <button type="button" onClick={() => $.setLocale("it")}>
          switch
        </button>
      </>
    );
  }

  await act(async () => {
    render(
      <toolset.ReactRMachine Suspense={React.Suspense} fallback={<div>loading...</div>}>
        <App />
      </toolset.ReactRMachine>
    );
  });
}

describe("ReactStandardStrategyCore — construction & defaultConfig", () => {
  it("exposes rMachine and config from constructor arguments", () => {
    const machine = createMockMachine() as never;
    const config = configWith({ localeDetector: () => "it" }) as never;
    const { strategy } = createStrategy({ machine, config });
    const exposed = strategy as unknown as { rMachine: unknown; config: unknown };
    expect(exposed.rMachine).toBe(machine);
    expect(exposed.config).toBe(config);
  });

  it("defaultConfig leaves localeDetector and localeStore undefined", () => {
    expect(ReactStandardStrategyCore.defaultConfig.localeDetector).toBeUndefined();
    expect(ReactStandardStrategyCore.defaultConfig.localeStore).toBeUndefined();
  });
});

describe("ReactStandardStrategyCore — createToolset config wiring", () => {
  it("falls back to rMachine.defaultLocale when neither detector nor store is configured", async () => {
    const machine = createMockMachine({ defaultLocale: "it" }) as never;
    const { strategy } = createStrategy({ machine, config: configWith() as never });
    await renderApp(await strategy.createToolset());
    expect(screen.getByTestId("locale").textContent).toBe("it");
  });

  it("uses localeDetector from the config for the initial locale", async () => {
    const { strategy } = createStrategy({ config: configWith({ localeDetector: () => "it" }) as never });
    await renderApp(await strategy.createToolset());
    expect(screen.getByTestId("locale").textContent).toBe("it");
  });

  it("uses localeStore from the config for the initial locale", async () => {
    const { strategy } = createStrategy({ config: configWith({ localeStore: syncStore("it") }) as never });
    await renderApp(await strategy.createToolset());
    expect(screen.getByTestId("locale").textContent).toBe("it");
  });

  it("delegates $.setLocale to the configured localeStore.set", async () => {
    const store = syncStore("en");
    const { strategy } = createStrategy({ config: configWith({ localeStore: store }) as never });
    let setLocale!: (l: string) => Promise<void>;
    await renderApp(await strategy.createToolset(), (fn) => {
      setLocale = fn;
    });

    await act(async () => {
      await setLocale("it");
    });

    expect(store.set).toHaveBeenCalledWith("it");
  });

  it("localeStore takes priority over localeDetector when the store has a value", async () => {
    const localeDetector = vi.fn(() => "en");
    const { strategy } = createStrategy({
      config: configWith({ localeStore: syncStore("it"), localeDetector }) as never,
    });
    await renderApp(await strategy.createToolset());
    expect(screen.getByTestId("locale").textContent).toBe("it");
    expect(localeDetector).not.toHaveBeenCalled();
  });

  it("falls back to localeDetector when localeStore.get() returns undefined (and persists it)", async () => {
    const localeDetector = vi.fn(() => "it");
    const store = syncStore(undefined);
    const { strategy } = createStrategy({ config: configWith({ localeStore: store, localeDetector }) as never });
    await renderApp(await strategy.createToolset());
    expect(screen.getByTestId("locale").textContent).toBe("it");
    expect(localeDetector).toHaveBeenCalled();
    expect(store.set).toHaveBeenCalledWith("it");
  });

  // Intentional pattern: try/catch + expect.unreachable — do not simplify.
  it("throws when localeDetector returns an invalid locale", async () => {
    const { strategy } = createStrategy({ config: configWith({ localeDetector: () => "xx" }) as never });
    const toolset = await strategy.createToolset();

    function App() {
      const { $ } = (toolset.Plug as () => { useR: () => { $: { locale: string } } })().useR();
      return <span>{$.locale}</span>;
    }

    try {
      render(
        <toolset.ReactRMachine>
          <App />
        </toolset.ReactRMachine>
      );
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineError);
      expect((error as RMachineError).message).toMatch(/Invalid locale detected: xx/);
    }
  });
});

describe("ReactStandardStrategyCore — rMachine forwarding", () => {
  it("forwards the rMachine to the toolset for resource resolution (getGateWire invoked)", async () => {
    const machine = createMockMachine({ resolve: () => ({ greeting: "hello" }) });
    const { strategy } = createStrategy({ machine: machine as never });
    await renderApp(await strategy.createToolset());
    expect(screen.getByTestId("greeting").textContent).toBe("hello");
    expect(spies(machine as never).getGateWire).toHaveBeenCalled();
  });

  it("validates the detected locale through rMachine.localeHelper", async () => {
    const machine = createMockMachine();
    const { strategy } = createStrategy({
      machine: machine as never,
      config: configWith({ localeDetector: () => "it" }) as never,
    });
    await renderApp(await strategy.createToolset());
    expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("it");
  });
});

describe("ReactStandardStrategyCore — async localeDetector", () => {
  it("supports an async localeDetector through Suspense", async () => {
    let resolveLocale!: (locale: string) => void;
    const localePromise = new Promise<string>((r) => {
      resolveLocale = r;
    });
    const { strategy } = createStrategy({ config: configWith({ localeDetector: () => localePromise }) as never });
    const toolset = await strategy.createToolset();

    function LocaleDisplay() {
      const { $ } = (toolset.Plug as () => { useR: () => { $: { locale: string } } })().useR();
      return <span data-testid="locale">{$.locale}</span>;
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

describe("ReactStandardStrategyCore — full integration (detect/store → render → setLocale)", () => {
  it("detector → store → render → switch → store.set", async () => {
    const store = syncStore(undefined);
    const machine = createMockMachine({ resolve: (_ns, locale) => ({ greeting: locale === "en" ? "hello" : "ciao" }) });
    const { strategy } = createStrategy({
      machine: machine as never,
      config: configWith({ localeStore: store, localeDetector: () => "en" }) as never,
    });

    await renderApp(await strategy.createToolset());

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

  it("store.get → render → switch → store.set", async () => {
    const store = syncStore("en");
    const machine = createMockMachine({ resolve: (_ns, locale) => ({ greeting: locale === "en" ? "hello" : "ciao" }) });
    const { strategy } = createStrategy({
      machine: machine as never,
      config: configWith({ localeStore: store }) as never,
    });

    await renderApp(await strategy.createToolset());

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
