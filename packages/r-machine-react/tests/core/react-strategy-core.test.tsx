import { act, cleanup, render, screen } from "@testing-library/react";
import type { RMachine } from "r-machine";
import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type ReactStrategyConfig, ReactStrategyCore } from "../../src/core/react-strategy-core.js";
import type { ReactImpl } from "../../src/core/react-toolset.js";
import { createMockImpl } from "../_fixtures/mock-impl.js";
import { createMockMachine, spies, type TestAtlas } from "../_fixtures/mock-machine.js";

afterEach(cleanup);

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type Cfg = ReactStrategyConfig<TestAtlas, {}>;

// Concrete subclass exposing a pluggable createImpl for the orchestration tests.
class ConcreteReactStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, E, EF, Cfg> {
  implFactory: () => Promise<ReactImpl<AnyLocale>>;

  constructor(
    rMachine: RMachine<TestAtlas, AnyLocale, E, EF>,
    config: Cfg,
    implFactory: () => Promise<ReactImpl<AnyLocale>>
  ) {
    super(rMachine, config);
    this.implFactory = implFactory;
  }

  protected createImpl(): Promise<ReactImpl<AnyLocale>> {
    return this.implFactory();
  }
}

const defaultConfig: Cfg = { kit: {}, reactCompiler: "off" };

function createStrategy(
  options: {
    machine?: RMachine<TestAtlas, AnyLocale, E, EF>;
    config?: Cfg;
    implFactory?: () => Promise<ReactImpl<AnyLocale>>;
  } = {}
) {
  const machine = options.machine ?? (createMockMachine() as never);
  const config = options.config ?? defaultConfig;
  const implFactory = options.implFactory ?? (() => Promise.resolve(createMockImpl()));
  return { strategy: new ConcreteReactStrategy(machine, config, implFactory), machine };
}

describe("ReactStrategyCore — construction", () => {
  it("exposes rMachine and config from constructor arguments", () => {
    const machine = createMockMachine() as never;
    const config: Cfg = { kit: {}, reactCompiler: "off" };
    const { strategy } = createStrategy({ machine, config });
    const exposed = strategy as unknown as { rMachine: unknown; config: unknown };
    expect(exposed.rMachine).toBe(machine);
    expect(exposed.config).toBe(config);
  });
});

describe("ReactStrategyCore — createToolset orchestration", () => {
  it("invokes createImpl once per call (no caching)", async () => {
    const implFactory = vi.fn(() => Promise.resolve(createMockImpl()));
    const { strategy } = createStrategy({ implFactory });

    await strategy.createToolset();
    await strategy.createToolset();
    await strategy.createToolset();

    expect(implFactory).toHaveBeenCalledTimes(3);
  });

  it("produces independent toolsets on repeated calls", async () => {
    const { strategy } = createStrategy();
    expect(await strategy.createToolset()).not.toBe(await strategy.createToolset());
  });

  it("propagates rejections from createImpl", async () => {
    const error = new Error("impl creation failed");
    const { strategy } = createStrategy({ implFactory: () => Promise.reject(error) });
    await expect(strategy.createToolset()).rejects.toBe(error);
  });

  it("awaits an async createImpl before assembling the toolset, then exposes { ReactRMachine, Plug }", async () => {
    let resolveImpl!: (impl: ReactImpl<AnyLocale>) => void;
    const implPromise = new Promise<ReactImpl<AnyLocale>>((r) => {
      resolveImpl = r;
    });
    const { strategy } = createStrategy({ implFactory: () => implPromise });

    const toolsetPromise = strategy.createToolset();
    let resolved = false;
    void toolsetPromise.then(() => {
      resolved = true;
    });

    await new Promise<void>((r) => setTimeout(r, 10));
    expect(resolved).toBe(false);

    resolveImpl(createMockImpl({ readLocale: () => "it" }));
    const toolset = await toolsetPromise;

    expect(toolset).toHaveProperty("ReactRMachine");
    expect(toolset).toHaveProperty("Plug");
  });
});

describe("ReactStrategyCore — rMachine forwarding", () => {
  it("forwards the strategy rMachine to the toolset's Plug (getWire invoked)", async () => {
    const machine = createMockMachine({ resolve: () => ({ greeting: "hello" }) });
    const { strategy } = createStrategy({ machine: machine as never });
    const toolset = await strategy.createToolset();

    function ResourceConsumer() {
      const [common] = (toolset.Plug as unknown as (...a: unknown[]) => { useR: () => [{ greeting: string }] })(
        "common"
      ).useR();
      return <div data-testid="greeting">{common.greeting}</div>;
    }

    await act(async () => {
      render(
        <toolset.ReactRMachine Suspense={React.Suspense} fallback={<div>loading</div>}>
          <ResourceConsumer />
        </toolset.ReactRMachine>
      );
    });

    expect(screen.getByTestId("greeting").textContent).toBe("hello");
    expect(spies(machine as never).getWire).toHaveBeenCalled();
  });
});

describe("ReactStrategyCore — impl integration", () => {
  function LocaleProbe({ toolset }: { toolset: Awaited<ReturnType<ConcreteReactStrategy["createToolset"]>> }) {
    const { $ } = (toolset.Plug as () => { useR: () => { $: { locale: string } } })().useR();
    return <span data-testid="locale">{$.locale}</span>;
  }

  it("uses impl.readLocale to determine the initial locale (sync)", async () => {
    const { strategy } = createStrategy({
      implFactory: () => Promise.resolve(createMockImpl({ readLocale: () => "it" })),
    });
    const toolset = await strategy.createToolset();

    await act(async () => {
      render(
        <toolset.ReactRMachine Suspense={React.Suspense} fallback={<div>loading</div>}>
          <LocaleProbe toolset={toolset} />
        </toolset.ReactRMachine>
      );
    });

    expect(screen.getByTestId("locale").textContent).toBe("it");
  });

  it("supports an async readLocale through Suspense", async () => {
    let resolveLocale!: (locale: string) => void;
    const localePromise = new Promise<string>((r) => {
      resolveLocale = r;
    });
    const { strategy } = createStrategy({
      implFactory: () => Promise.resolve(createMockImpl({ readLocale: () => localePromise })),
    });
    const toolset = await strategy.createToolset();

    await act(async () => {
      render(
        <toolset.ReactRMachine Suspense={React.Suspense} fallback={<div>loading...</div>}>
          <LocaleProbe toolset={toolset} />
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

  it("delegates $.setLocale to impl.writeLocale", async () => {
    const writeLocale = vi.fn();
    const { strategy } = createStrategy({
      implFactory: () => Promise.resolve(createMockImpl({ readLocale: () => "en", writeLocale })),
    });
    const toolset = await strategy.createToolset();

    let setLocale!: (l: string) => Promise<void>;
    function Capture() {
      const { $ } = (toolset.Plug as () => { useR: () => { $: { setLocale: (l: string) => Promise<void> } } })().useR();
      setLocale = $.setLocale;
      return null;
    }

    await act(async () => {
      render(
        <toolset.ReactRMachine Suspense={React.Suspense} fallback={<div>loading</div>}>
          <Capture />
        </toolset.ReactRMachine>
      );
    });

    await act(async () => {
      await setLocale("it");
    });

    expect(writeLocale).toHaveBeenCalledWith("it");
  });
});
