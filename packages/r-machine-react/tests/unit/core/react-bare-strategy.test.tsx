import { cleanup, render, renderHook, screen } from "@testing-library/react";
import type { RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { Strategy } from "r-machine/strategy";
import { type ReactNode, Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReactBareStrategy } from "../../../src/core/react-bare-strategy.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Test resource atlas type
// ---------------------------------------------------------------------------

type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const VALID_LOCALES = new Set(["en", "it"]);

function createMockMachine(
  overrides: {
    hybridPickR?: (locale: string, namespace: string) => unknown;
    hybridPickRKit?: (locale: string, ...namespaces: string[]) => unknown;
  } = {}
) {
  return {
    localeHelper: {
      validateLocale: vi.fn((locale: string) =>
        VALID_LOCALES.has(locale)
          ? null
          : new RMachineError(`Locale "${locale}" is invalid or is not in the list of locales.`)
      ),
    },
    hybridPickR: vi.fn(overrides.hybridPickR ?? (() => ({ greeting: "hello" }))),
    hybridPickRKit: vi.fn(overrides.hybridPickRKit ?? (() => [{ greeting: "hello" }, { home: "Home" }])),
  } as unknown as RMachine<TestAtlas>;
}

// ---------------------------------------------------------------------------
// Construction & inheritance
// ---------------------------------------------------------------------------

describe("ReactBareStrategy", () => {
  describe("construction", () => {
    it("can be instantiated with an RMachine and undefined config", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy).toBeInstanceOf(ReactBareStrategy);
    });

    it("extends Strategy", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy).toBeInstanceOf(Strategy);
    });

    it("exposes the rMachine property from the base class", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy.rMachine).toBe(machine);
    });

    it("exposes the config property as undefined", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy.config).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns a promise", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const result = strategy.createToolset();
      expect(result).toBeInstanceOf(Promise);
    });

    it("resolves to a toolset object", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();
      expect(toolset).toBeDefined();
      expect(typeof toolset).toBe("object");
    });

    it("returns a toolset with ReactRMachine", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();
      expect(toolset).toHaveProperty("ReactRMachine");
      expect(typeof toolset.ReactRMachine).toBe("function");
    });

    it("returns a toolset with useLocale hook", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();
      expect(toolset).toHaveProperty("useLocale");
      expect(typeof toolset.useLocale).toBe("function");
    });

    it("returns a toolset with useSetLocale hook", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();
      expect(toolset).toHaveProperty("useSetLocale");
      expect(typeof toolset.useSetLocale).toBe("function");
    });

    it("returns a toolset with useR hook", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();
      expect(toolset).toHaveProperty("useR");
      expect(typeof toolset.useR).toBe("function");
    });

    it("returns a toolset with useRKit hook", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();
      expect(toolset).toHaveProperty("useRKit");
      expect(typeof toolset.useRKit).toBe("function");
    });

    it("returns a toolset with ReactRMachine.probe", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();
      expect(typeof toolset.ReactRMachine.probe).toBe("function");
    });

    it("passes the rMachine to the underlying toolset factory", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();

      // Verify the toolset is wired to our specific machine by using probe
      // which delegates to machine.localeHelper.validateLocale
      toolset.ReactRMachine.probe("en");
      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("en");
    });

    it("produces independent toolsets on repeated calls", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset1 = await strategy.createToolset();
      const toolset2 = await strategy.createToolset();

      // Each call produces a new toolset instance
      expect(toolset1).not.toBe(toolset2);
    });

    it("produces toolsets that share the same rMachine", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset1 = await strategy.createToolset();
      const toolset2 = await strategy.createToolset();

      // Both toolsets should be wired to the same machine
      toolset1.ReactRMachine.probe("en");
      toolset2.ReactRMachine.probe("it");

      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("en");
      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("it");
    });
  });

  // -----------------------------------------------------------------------
  // Integration: toolset from strategy works end-to-end
  // -----------------------------------------------------------------------

  describe("integration", () => {
    it("ReactRMachine renders children with a valid locale", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine } = await strategy.createToolset();

      render(
        <ReactRMachine locale="en">
          <div>child content</div>
        </ReactRMachine>
      );

      expect(screen.getByText("child content")).toBeDefined();
    });

    it("ReactRMachine throws for an invalid locale", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine } = await strategy.createToolset();

      expect(() =>
        render(
          <ReactRMachine locale="xx">
            <div>child</div>
          </ReactRMachine>
        )
      ).toThrow(RMachineError);
    });

    it("useLocale returns the locale from the provider", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useLocale } = await strategy.createToolset();

      const { result } = renderHook(() => useLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect(result.current).toBe("en");
    });

    it("useR retrieves a resource via hybridPickR", async () => {
      const resource = { greeting: "hello" };
      const machine = createMockMachine({ hybridPickR: () => resource });
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine, useR } = await strategy.createToolset();

      const { result } = renderHook(() => useR("common"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect(result.current).toBe(resource);
      expect((machine as any).hybridPickR).toHaveBeenCalledWith("en", "common");
    });

    it("useRKit retrieves a resource kit via hybridPickRKit", async () => {
      const kit = [{ greeting: "hello" }, { home: "Home" }] as const;
      const machine = createMockMachine({ hybridPickRKit: () => kit });
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine, useRKit } = await strategy.createToolset();

      const { result } = renderHook(() => useRKit("common", "nav"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect(result.current).toBe(kit);
      expect((machine as any).hybridPickRKit).toHaveBeenCalledWith("en", "common", "nav");
    });

    it("probe validates locales through the strategy's machine", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine } = await strategy.createToolset();

      expect(ReactRMachine.probe("en")).toBe("en");
      expect(ReactRMachine.probe("xx")).toBeUndefined();
      expect(ReactRMachine.probe(undefined)).toBeUndefined();
    });

    it("useSetLocale delegates to writeLocale through the strategy's toolset", async () => {
      const writeLocale = vi.fn();
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useSetLocale } = await strategy.createToolset();

      function SetLocaleButton() {
        const setLocale = useSetLocale();
        return (
          <button type="button" onClick={() => setLocale("it")}>
            change
          </button>
        );
      }

      render(
        <ReactRMachine locale="en" writeLocale={writeLocale}>
          <SetLocaleButton />
        </ReactRMachine>
      );

      const { act } = await import("@testing-library/react");
      await act(async () => {
        screen.getByText("change").click();
      });

      expect(writeLocale).toHaveBeenCalledWith("it");
    });

    it("works with different RMachine instances", async () => {
      const machine1 = createMockMachine({ hybridPickR: () => ({ greeting: "hello" }) });
      const machine2 = createMockMachine({ hybridPickR: () => ({ greeting: "ciao" }) });

      const strategy1 = new ReactBareStrategy(machine1, undefined);
      const strategy2 = new ReactBareStrategy(machine2, undefined);

      const toolset1 = await strategy1.createToolset();
      const toolset2 = await strategy2.createToolset();

      const { result: result1 } = renderHook(() => toolset1.useR("common"), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <toolset1.ReactRMachine locale="en">{children}</toolset1.ReactRMachine>
        ),
      });

      cleanup();

      const { result: result2 } = renderHook(() => toolset2.useR("common"), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <toolset2.ReactRMachine locale="en">{children}</toolset2.ReactRMachine>
        ),
      });

      expect(result1.current).toEqual({ greeting: "hello" });
      expect(result2.current).toEqual({ greeting: "ciao" });
    });
  });

  // -----------------------------------------------------------------------
  // Hooks outside provider
  // -----------------------------------------------------------------------

  describe("hooks outside provider", () => {
    it("useLocale throws RMachineError when used outside ReactRMachine", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { useLocale } = await strategy.createToolset();

      expect(() => renderHook(() => useLocale())).toThrow(RMachineError);
    });

    it("useLocale error message mentions context not found", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { useLocale } = await strategy.createToolset();

      expect(() => renderHook(() => useLocale())).toThrow("ReactBareToolsetContext not found.");
    });

    it("useSetLocale throws RMachineError when used outside ReactRMachine", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { useSetLocale } = await strategy.createToolset();

      expect(() => renderHook(() => useSetLocale())).toThrow(RMachineError);
    });

    it("useR throws RMachineError when used outside ReactRMachine", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { useR } = await strategy.createToolset();

      expect(() => renderHook(() => useR("common"))).toThrow(RMachineError);
    });

    it("useRKit throws RMachineError when used outside ReactRMachine", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { useRKit } = await strategy.createToolset();

      expect(() => renderHook(() => useRKit("common", "nav"))).toThrow(RMachineError);
    });
  });

  // -----------------------------------------------------------------------
  // useSetLocale edge cases
  // -----------------------------------------------------------------------

  describe("useSetLocale edge cases", () => {
    it("is a no-op when setting the same locale", async () => {
      const writeLocale = vi.fn();
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useSetLocale } = await strategy.createToolset();

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      const { act } = await import("@testing-library/react");
      await act(async () => {
        await result.current("en");
      });

      expect(writeLocale).not.toHaveBeenCalled();
    });

    it("throws when setting an invalid locale", async () => {
      const writeLocale = vi.fn();
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useSetLocale } = await strategy.createToolset();

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      await expect(result.current("xx")).rejects.toBeInstanceOf(RMachineError);
      expect(writeLocale).not.toHaveBeenCalled();
    });

    it("throws RMachineError when no writeLocale is provided", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useSetLocale } = await strategy.createToolset();

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      await expect(result.current("it")).rejects.toThrow("No writeLocale function provided to <ReactRMachine>.");
    });

    it("awaits an async writeLocale", async () => {
      const order: string[] = [];
      const asyncWriteLocale = vi.fn(async () => {
        order.push("write-start");
        await new Promise((r) => setTimeout(r, 10));
        order.push("write-end");
      });
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useSetLocale } = await strategy.createToolset();

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={asyncWriteLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      const { act } = await import("@testing-library/react");
      await act(async () => {
        await result.current("it");
      });

      expect(asyncWriteLocale).toHaveBeenCalledWith("it");
      expect(order).toEqual(["write-start", "write-end"]);
    });

    it("calls a synchronous writeLocale without awaiting", async () => {
      const syncWriteLocale = vi.fn();
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useSetLocale } = await strategy.createToolset();

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={syncWriteLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      const { act } = await import("@testing-library/react");
      await act(async () => {
        await result.current("it");
      });

      expect(syncWriteLocale).toHaveBeenCalledWith("it");
    });

    it("picks up a new writeLocale when the prop changes", async () => {
      const writeLocaleA = vi.fn();
      const writeLocaleB = vi.fn();
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useSetLocale } = await strategy.createToolset();

      let writeLocaleRef: (newLocale: string) => void | Promise<void> = writeLocaleA;
      const { result, rerender } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocaleRef}>
            {children}
          </ReactRMachine>
        ),
      });

      writeLocaleRef = writeLocaleB;
      rerender();

      const { act } = await import("@testing-library/react");
      await act(async () => {
        await result.current("it");
      });

      expect(writeLocaleA).not.toHaveBeenCalled();
      expect(writeLocaleB).toHaveBeenCalledWith("it");
    });
  });

  // -----------------------------------------------------------------------
  // Suspense behavior (useR / useRKit throw promises)
  // -----------------------------------------------------------------------

  describe("suspense", () => {
    it("useR suspends when hybridPickR returns a Promise", async () => {
      const pending = new Promise(() => {});
      const machine = createMockMachine({ hybridPickR: () => pending });
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine, useR } = await strategy.createToolset();

      function Consumer() {
        const r = useR("common");
        return <div>{r.greeting}</div>;
      }

      render(
        <ReactRMachine locale="en">
          <Suspense fallback={<span>loading</span>}>
            <Consumer />
          </Suspense>
        </ReactRMachine>
      );

      expect(screen.getByText("loading")).toBeDefined();
    });

    it("useR resolves and renders content after the promise settles", async () => {
      let resolve!: (value: unknown) => void;
      const pending = new Promise((r) => {
        resolve = r;
      });
      const resource = { greeting: "hello" };
      let suspended = true;
      const machine = createMockMachine({
        hybridPickR: () => (suspended ? pending : resource),
      });
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine, useR } = await strategy.createToolset();

      function Consumer() {
        const r = useR("common");
        return <div>{r.greeting}</div>;
      }

      render(
        <ReactRMachine locale="en">
          <Suspense fallback={<span>loading</span>}>
            <Consumer />
          </Suspense>
        </ReactRMachine>
      );

      expect(screen.getByText("loading")).toBeDefined();

      suspended = false;
      const { act } = await import("@testing-library/react");
      await act(async () => {
        resolve(resource);
      });

      expect(screen.getByText("hello")).toBeDefined();
    });

    it("useRKit suspends when hybridPickRKit returns a Promise", async () => {
      const pending = new Promise(() => {});
      const machine = createMockMachine({ hybridPickRKit: () => pending });
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine, useRKit } = await strategy.createToolset();

      function Consumer() {
        const [common] = useRKit("common");
        return <div>{common.greeting}</div>;
      }

      render(
        <ReactRMachine locale="en">
          <Suspense fallback={<span>loading</span>}>
            <Consumer />
          </Suspense>
        </ReactRMachine>
      );

      expect(screen.getByText("loading")).toBeDefined();
    });

    it("useRKit resolves and renders content after the promise settles", async () => {
      let resolve!: (value: unknown) => void;
      const pending = new Promise((r) => {
        resolve = r;
      });
      const kit = [{ greeting: "hello" }, { home: "Home" }] as const;
      let suspended = true;
      const machine = createMockMachine({
        hybridPickRKit: () => (suspended ? pending : kit),
      });
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine, useRKit } = await strategy.createToolset();

      function Consumer() {
        const [common] = useRKit("common");
        return <div>{common.greeting}</div>;
      }

      render(
        <ReactRMachine locale="en">
          <Suspense fallback={<span>loading</span>}>
            <Consumer />
          </Suspense>
        </ReactRMachine>
      );

      expect(screen.getByText("loading")).toBeDefined();

      suspended = false;
      const { act } = await import("@testing-library/react");
      await act(async () => {
        resolve(kit);
      });

      expect(screen.getByText("hello")).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // ReactRMachine error messages
  // -----------------------------------------------------------------------

  describe("ReactRMachine error messages", () => {
    it("includes the invalid locale in the error message", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine } = await strategy.createToolset();

      expect(() =>
        render(
          <ReactRMachine locale="xx">
            <div>child</div>
          </ReactRMachine>
        )
      ).toThrow(/invalid locale provided "xx"/);
    });

    it("wraps the validation error as the cause", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine } = await strategy.createToolset();

      try {
        render(
          <ReactRMachine locale="xx">
            <div>child</div>
          </ReactRMachine>
        );
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(RMachineError);
        expect((err as RMachineError).innerError).toBeInstanceOf(RMachineError);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Locale change re-renders
  // -----------------------------------------------------------------------

  describe("locale reactivity", () => {
    it("useR re-fetches when locale changes", async () => {
      const machine = createMockMachine({
        hybridPickR: (locale: string) => (locale === "en" ? { greeting: "hello" } : { greeting: "ciao" }),
      });
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine, useR } = await strategy.createToolset();

      let localeRef = "en";
      const { result, rerender } = renderHook(() => useR("common"), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale={localeRef}>{children}</ReactRMachine>
        ),
      });

      expect(result.current).toEqual({ greeting: "hello" });

      localeRef = "it";
      rerender();
      expect(result.current).toEqual({ greeting: "ciao" });
    });

    it("useLocale reflects the updated locale", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine, useLocale } = await strategy.createToolset();

      let localeRef = "en";
      const { result, rerender } = renderHook(() => useLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale={localeRef}>{children}</ReactRMachine>
        ),
      });

      expect(result.current).toBe("en");

      localeRef = "it";
      rerender();
      expect(result.current).toBe("it");
    });
  });

  // -----------------------------------------------------------------------
  // probe edge cases
  // -----------------------------------------------------------------------

  describe("probe edge cases", () => {
    it("returns the locale string for a valid locale", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine } = await strategy.createToolset();
      expect(ReactRMachine.probe("en")).toBe("en");
    });

    it("returns undefined for an invalid locale", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine } = await strategy.createToolset();
      expect(ReactRMachine.probe("xx")).toBeUndefined();
    });

    it("returns undefined for undefined input", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine } = await strategy.createToolset();
      expect(ReactRMachine.probe(undefined)).toBeUndefined();
    });

    it("returns undefined for an empty string", async () => {
      const strategy = new ReactBareStrategy(createMockMachine(), undefined);
      const { ReactRMachine } = await strategy.createToolset();
      expect(ReactRMachine.probe("")).toBeUndefined();
    });

    it("calls validateLocale on the machine for each probe", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine } = await strategy.createToolset();

      ReactRMachine.probe("en");
      ReactRMachine.probe("it");
      ReactRMachine.probe("xx");

      expect(machine.localeHelper.validateLocale).toHaveBeenCalledTimes(3);
      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("en");
      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("it");
      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("xx");
    });

    it("does not call validateLocale when input is undefined", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const { ReactRMachine } = await strategy.createToolset();

      ReactRMachine.probe(undefined);

      expect(machine.localeHelper.validateLocale).not.toHaveBeenCalled();
    });
  });
});
