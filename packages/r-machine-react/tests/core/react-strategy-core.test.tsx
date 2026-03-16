import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { Strategy } from "r-machine/strategy";
import type { ReactNode } from "react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReactStrategyCore } from "../../src/core/react-strategy-core.js";
import type { ReactImpl } from "../../src/core/react-toolset.js";
import { createMockImpl } from "../_fixtures/mock-impl.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type TestConfig = { readonly label: string };

class ConcreteReactStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, TestConfig> {
  implFactory: () => Promise<ReactImpl<AnyLocale>>;

  constructor(
    rMachine: RMachine<TestAtlas, AnyLocale>,
    config: TestConfig,
    implFactory: () => Promise<ReactImpl<AnyLocale>>
  ) {
    super(rMachine, config);
    this.implFactory = implFactory;
  }

  protected createImpl(): Promise<ReactImpl<AnyLocale>> {
    return this.implFactory();
  }
}

const defaultConfig: TestConfig = { label: "test" };

function createStrategy(
  options: {
    machine?: RMachine<TestAtlas, AnyLocale>;
    config?: TestConfig;
    implFactory?: () => Promise<ReactImpl<AnyLocale>>;
  } = {}
) {
  const machine = options.machine ?? createMockMachine();
  const config = options.config ?? defaultConfig;
  const implFactory = options.implFactory ?? (() => Promise.resolve(createMockImpl()));
  return { strategy: new ConcreteReactStrategy(machine, config, implFactory), machine };
}

// ---------------------------------------------------------------------------
// ReactStrategyCore
// ---------------------------------------------------------------------------

describe("ReactStrategyCore", () => {
  // -----------------------------------------------------------------------
  // construction
  // -----------------------------------------------------------------------

  describe("construction", () => {
    it("extends Strategy", () => {
      const { strategy } = createStrategy();
      expect(strategy).toBeInstanceOf(Strategy);
    });

    it("exposes the rMachine property from the base class", () => {
      const machine = createMockMachine();
      const { strategy } = createStrategy({ machine });
      expect(strategy.rMachine).toBe(machine);
    });

    it("exposes the config property from the base class", () => {
      const config: TestConfig = { label: "custom" };
      const { strategy } = createStrategy({ config });
      expect(strategy.config).toBe(config);
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — orchestration
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("invokes createImpl once per call", async () => {
      const implFactory = vi.fn(() => Promise.resolve(createMockImpl()));
      const { strategy } = createStrategy({ implFactory });

      await strategy.createToolset();

      expect(implFactory).toHaveBeenCalledOnce();
    });

    it("invokes createImpl on every createToolset call (no caching)", async () => {
      const implFactory = vi.fn(() => Promise.resolve(createMockImpl()));
      const { strategy } = createStrategy({ implFactory });

      await strategy.createToolset();
      await strategy.createToolset();
      await strategy.createToolset();

      expect(implFactory).toHaveBeenCalledTimes(3);
    });

    it("produces independent toolsets on repeated calls", async () => {
      const { strategy } = createStrategy();
      const toolset1 = await strategy.createToolset();
      const toolset2 = await strategy.createToolset();

      expect(toolset1).not.toBe(toolset2);
    });

    it("propagates rejections from createImpl", async () => {
      const error = new Error("impl creation failed");
      const { strategy } = createStrategy({
        implFactory: () => Promise.reject(error),
      });

      await expect(strategy.createToolset()).rejects.toBe(error);
    });

    it("awaits an async createImpl before assembling the toolset", async () => {
      let resolveImpl!: (impl: ReactImpl<AnyLocale>) => void;
      const implPromise = new Promise<ReactImpl<AnyLocale>>((r) => {
        resolveImpl = r;
      });
      const { strategy } = createStrategy({
        implFactory: () => implPromise,
      });

      const toolsetPromise = strategy.createToolset();
      let resolved = false;
      toolsetPromise.then(() => {
        resolved = true;
      });

      // Give microtasks time to settle
      await new Promise<void>((r) => setTimeout(r, 10));
      expect(resolved).toBe(false);

      resolveImpl(createMockImpl({ readLocale: () => "it" }));
      const toolset = await toolsetPromise;

      expect(toolset).toHaveProperty("ReactRMachine");
      expect(toolset).toHaveProperty("useLocale");
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — rMachine forwarding
  // -----------------------------------------------------------------------

  describe("createToolset — rMachine forwarding", () => {
    it("forwards the strategy rMachine to the toolset", async () => {
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

    it("toolsets from the same strategy share the same rMachine", async () => {
      const machine = createMockMachine();
      const { strategy } = createStrategy({ machine });
      const toolset1 = await strategy.createToolset();
      const toolset2 = await strategy.createToolset();

      function Resource1() {
        toolset1.useR("common");
        return null;
      }
      function Resource2() {
        toolset2.useR("common");
        return null;
      }

      render(
        <toolset1.ReactRMachine>
          <Resource1 />
        </toolset1.ReactRMachine>
      );
      cleanup();

      render(
        <toolset2.ReactRMachine>
          <Resource2 />
        </toolset2.ReactRMachine>
      );

      // Both toolsets invoked hybridPickR on the same shared machine instance
      expect((machine as any).hybridPickR).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // createToolset — impl integration
  // -----------------------------------------------------------------------

  describe("createToolset — impl integration", () => {
    it("uses the impl readLocale to determine the initial locale", async () => {
      const impl = createMockImpl({ readLocale: () => "it" });
      const { strategy } = createStrategy({
        implFactory: () => Promise.resolve(impl),
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

    it("supports an async readLocale through Suspense", async () => {
      let resolveLocale!: (locale: string) => void;
      const localePromise = new Promise<string>((r) => {
        resolveLocale = r;
      });
      const impl = createMockImpl({ readLocale: () => localePromise });
      const { strategy } = createStrategy({
        implFactory: () => Promise.resolve(impl),
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

    it("delegates locale writes to the impl writeLocale", async () => {
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { strategy } = createStrategy({
        implFactory: () => Promise.resolve(impl),
      });
      const toolset = await strategy.createToolset();

      const { result } = renderHook(() => toolset.useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <toolset.ReactRMachine>{children}</toolset.ReactRMachine>,
      });

      await act(async () => {
        await result.current("it");
      });

      expect(writeLocale).toHaveBeenCalledWith("it");
    });
  });
});
