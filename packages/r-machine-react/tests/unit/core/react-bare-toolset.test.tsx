import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createReactBareToolset } from "../../../src/core/react-bare-toolset.js";

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
// createReactBareToolset
// ---------------------------------------------------------------------------

describe("createReactBareToolset", () => {
  it("returns a toolset with all expected members", async () => {
    const toolset = await createReactBareToolset(createMockMachine());

    expect(toolset).toHaveProperty("ReactRMachine");
    expect(toolset).toHaveProperty("useLocale");
    expect(toolset).toHaveProperty("useSetLocale");
    expect(toolset).toHaveProperty("useR");
    expect(toolset).toHaveProperty("useRKit");
  });

  it("returns ReactRMachine as a function with a probe method", async () => {
    const { ReactRMachine } = await createReactBareToolset(createMockMachine());

    expect(typeof ReactRMachine).toBe("function");
    expect(typeof ReactRMachine.probe).toBe("function");
  });

  // -----------------------------------------------------------------------
  // ReactRMachine (provider component)
  // -----------------------------------------------------------------------

  describe("ReactRMachine", () => {
    it("renders children when a valid locale is provided", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());

      render(
        <ReactRMachine locale="en">
          <div>child content</div>
        </ReactRMachine>
      );

      expect(screen.getByText("child content")).toBeDefined();
    });

    it("renders multiple children", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());

      render(
        <ReactRMachine locale="en">
          <div>first</div>
          <div>second</div>
        </ReactRMachine>
      );

      expect(screen.getByText("first")).toBeDefined();
      expect(screen.getByText("second")).toBeDefined();
    });

    it("throws RMachineError for an invalid locale", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());

      expect(() =>
        render(
          <ReactRMachine locale="xx">
            <div>child</div>
          </ReactRMachine>
        )
      ).toThrow(RMachineError);
    });

    it("includes the invalid locale in the error message", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());

      expect(() =>
        render(
          <ReactRMachine locale="xx">
            <div>child</div>
          </ReactRMachine>
        )
      ).toThrow(/invalid locale provided "xx"/);
    });

    it("wraps the validation error as innerError", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());

      try {
        render(
          <ReactRMachine locale="xx">
            <div>child</div>
          </ReactRMachine>
        );
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect((error as RMachineError).innerError).toBeInstanceOf(RMachineError);
      }
    });

    it("renders with explicitly undefined writeLocale", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());

      render(
        <ReactRMachine locale="en" writeLocale={undefined}>
          <div>child</div>
        </ReactRMachine>
      );

      expect(screen.getByText("child")).toBeDefined();
    });

    it("inner provider overrides outer provider", async () => {
      const { ReactRMachine, useLocale } = await createReactBareToolset(createMockMachine());

      function LocaleDisplay() {
        return <span data-testid="locale">{useLocale()}</span>;
      }

      render(
        <ReactRMachine locale="en">
          <ReactRMachine locale="it">
            <LocaleDisplay />
          </ReactRMachine>
        </ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });

    it("memoizes context value when locale and writeLocale are stable", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());
      const writeLocale = vi.fn();

      let renderCount = 0;
      const MemoChild = React.memo(function MemoChild() {
        renderCount++;
        return null;
      });

      const { rerender } = render(
        <ReactRMachine locale="en" writeLocale={writeLocale}>
          <MemoChild />
        </ReactRMachine>
      );

      expect(renderCount).toBe(1);

      rerender(
        <ReactRMachine locale="en" writeLocale={writeLocale}>
          <MemoChild />
        </ReactRMachine>
      );

      // MemoChild should not re-render because useMemo keeps the same context value
      expect(renderCount).toBe(1);
    });

    it("updates context when writeLocale prop changes", async () => {
      const writeLocale1 = vi.fn();
      const writeLocale2 = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      function SetLocaleButton() {
        const setLocale = useSetLocale();
        return (
          <button type="button" onClick={() => setLocale("it")}>
            change
          </button>
        );
      }

      const { rerender } = render(
        <ReactRMachine locale="en" writeLocale={writeLocale1}>
          <SetLocaleButton />
        </ReactRMachine>
      );

      rerender(
        <ReactRMachine locale="en" writeLocale={writeLocale2}>
          <SetLocaleButton />
        </ReactRMachine>
      );

      await act(async () => {
        screen.getByText("change").click();
      });

      expect(writeLocale1).not.toHaveBeenCalled();
      expect(writeLocale2).toHaveBeenCalledWith("it");
    });

    it("re-renders children when locale changes", async () => {
      const { ReactRMachine, useLocale } = await createReactBareToolset(createMockMachine());

      function LocaleDisplay() {
        return <span>{useLocale()}</span>;
      }

      const { rerender } = render(
        <ReactRMachine locale="en">
          <LocaleDisplay />
        </ReactRMachine>
      );

      expect(screen.queryByText("en")).not.toBeNull();
      expect(screen.queryByText("it")).toBeNull();

      rerender(
        <ReactRMachine locale="it">
          <LocaleDisplay />
        </ReactRMachine>
      );

      expect(screen.queryByText("it")).not.toBeNull();
      expect(screen.queryByText("en")).toBeNull();
    });

    it("passes writeLocale through context", async () => {
      const writeLocale = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

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

      await act(async () => {
        screen.getByText("change").click();
      });

      expect(writeLocale).toHaveBeenCalledWith("it");
    });
  });

  // -----------------------------------------------------------------------
  // ReactRMachine.probe
  // -----------------------------------------------------------------------

  describe("ReactRMachine.probe", () => {
    it("returns the locale if it is valid", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());
      expect(ReactRMachine.probe("en")).toBe("en");
    });

    it("returns the locale for another valid locale", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());
      expect(ReactRMachine.probe("it")).toBe("it");
    });

    it("returns undefined if the locale is invalid", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());
      expect(ReactRMachine.probe("xx")).toBeUndefined();
    });

    it("returns undefined if the locale is undefined", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());
      expect(ReactRMachine.probe(undefined)).toBeUndefined();
    });

    it("returns undefined for an empty string", async () => {
      const { ReactRMachine } = await createReactBareToolset(createMockMachine());
      expect(ReactRMachine.probe("")).toBeUndefined();
    });

    it("calls validateLocale on the machine for each probe", async () => {
      const mock = createMockMachine();
      const { ReactRMachine } = await createReactBareToolset(mock);

      ReactRMachine.probe("en");
      ReactRMachine.probe("xx");

      expect(mock.localeHelper.validateLocale).toHaveBeenCalledWith("en");
      expect(mock.localeHelper.validateLocale).toHaveBeenCalledWith("xx");
    });

    it("does not call validateLocale when locale is undefined", async () => {
      const mock = createMockMachine();
      const { ReactRMachine } = await createReactBareToolset(mock);

      ReactRMachine.probe(undefined);

      // validateLocale is also called during createReactBareToolset setup,
      // but not for probe(undefined)
      const calls = (mock.localeHelper.validateLocale as ReturnType<typeof vi.fn>).mock.calls;
      const undefinedCalls = calls.filter((args) => args[0] === undefined);
      expect(undefinedCalls).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // useLocale
  // -----------------------------------------------------------------------

  describe("useLocale", () => {
    it("returns the current locale from context", async () => {
      const { ReactRMachine, useLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect(result.current).toBe("en");
    });

    it("updates when the provider locale changes", async () => {
      const { ReactRMachine, useLocale } = await createReactBareToolset(createMockMachine());

      function LocaleDisplay() {
        return <span data-testid="locale">{useLocale()}</span>;
      }

      const { rerender } = render(
        <ReactRMachine locale="en">
          <LocaleDisplay />
        </ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("en");

      rerender(
        <ReactRMachine locale="it">
          <LocaleDisplay />
        </ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });

    it("throws when used outside ReactRMachine", async () => {
      const { useLocale } = await createReactBareToolset(createMockMachine());

      expect(() => renderHook(() => useLocale())).toThrow(RMachineError);
    });

    it("throws with a descriptive context-not-found message", async () => {
      const { useLocale } = await createReactBareToolset(createMockMachine());

      expect(() => renderHook(() => useLocale())).toThrow(/ReactBareToolsetContext not found/);
    });
  });

  // -----------------------------------------------------------------------
  // useSetLocale
  // -----------------------------------------------------------------------

  describe("useSetLocale", () => {
    it("throws when used outside ReactRMachine", async () => {
      const { useSetLocale } = await createReactBareToolset(createMockMachine());
      expect(() => renderHook(() => useSetLocale())).toThrow(RMachineError);
    });

    it("returns a function", async () => {
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={() => {}}>
            {children}
          </ReactRMachine>
        ),
      });

      expect(typeof result.current).toBe("function");
    });

    it("is a no-op when the new locale equals the current locale", async () => {
      const writeLocale = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      await act(async () => {
        await result.current("en");
      });

      expect(writeLocale).not.toHaveBeenCalled();
    });

    it("calls writeLocale with the new locale", async () => {
      const writeLocale = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      await act(async () => {
        await result.current("it");
      });

      expect(writeLocale).toHaveBeenCalledWith("it");
    });

    it("throws when the new locale is invalid", async () => {
      const writeLocale = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      await expect(
        act(async () => {
          await result.current("xx");
        })
      ).rejects.toThrow(RMachineError);

      expect(writeLocale).not.toHaveBeenCalled();
    });

    it("throws when no writeLocale function is provided", async () => {
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      await expect(
        act(async () => {
          await result.current("it");
        })
      ).rejects.toThrow(/No writeLocale function provided/);
    });

    it("awaits an async writeLocale", async () => {
      const order: string[] = [];
      const asyncWriteLocale = vi.fn(async () => {
        await new Promise<void>((r) => setTimeout(r, 10));
        order.push("writeLocale-done");
      });

      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={asyncWriteLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      await act(async () => {
        await result.current("it");
        order.push("setLocale-done");
      });

      expect(asyncWriteLocale).toHaveBeenCalledWith("it");
      expect(order).toEqual(["writeLocale-done", "setLocale-done"]);
    });

    it("handles a synchronous writeLocale", async () => {
      const syncWriteLocale = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={syncWriteLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      await act(async () => {
        await result.current("it");
      });

      expect(syncWriteLocale).toHaveBeenCalledWith("it");
    });

    it("returns a stable function reference when context is unchanged", async () => {
      const writeLocale = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result, rerender } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      const firstRef = result.current;
      rerender();
      expect(result.current).toBe(firstRef);
    });

    it("throws the raw validation error without innerError wrapping", async () => {
      const writeLocale = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      try {
        await act(async () => {
          await result.current("xx");
        });
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect((error as RMachineError).innerError).toBeUndefined();
      }
    });

    it("validates the locale before checking for writeLocale", async () => {
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      // Invalid locale should throw validation error, not "No writeLocale" error
      await expect(
        act(async () => {
          await result.current("xx");
        })
      ).rejects.toThrow(/invalid|is not in the list/i);
    });

    it("propagates a synchronous error thrown by writeLocale", async () => {
      const writeLocale = vi.fn(() => {
        throw new Error("storage failure");
      });
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      await expect(
        act(async () => {
          await result.current("it");
        })
      ).rejects.toThrow("storage failure");
    });

    it("propagates a rejected promise from writeLocale", async () => {
      const writeLocale = vi.fn(() => Promise.reject(new Error("network error")));
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ReactRMachine locale="en" writeLocale={writeLocale}>
            {children}
          </ReactRMachine>
        ),
      });

      await expect(
        act(async () => {
          await result.current("it");
        })
      ).rejects.toThrow("network error");
    });
  });

  // -----------------------------------------------------------------------
  // useR
  // -----------------------------------------------------------------------

  describe("useR", () => {
    it("throws when used outside ReactRMachine", async () => {
      const { useR } = await createReactBareToolset(createMockMachine());
      expect(() => renderHook(() => useR("common"))).toThrow(RMachineError);
    });

    it("returns the resource synchronously when cached", async () => {
      const resource = { greeting: "hello" };
      const mock = createMockMachine({
        hybridPickR: () => resource,
      });
      const { ReactRMachine, useR } = await createReactBareToolset(mock);

      const { result } = renderHook(() => useR("common"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect(result.current).toBe(resource);
    });

    it("calls hybridPickR with the current locale and namespace", async () => {
      const mock = createMockMachine();
      const { ReactRMachine, useR } = await createReactBareToolset(mock);

      renderHook(() => useR("common"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect((mock as any).hybridPickR).toHaveBeenCalledWith("en", "common");
    });

    it("calls hybridPickR with the updated locale after re-render", async () => {
      const mock = createMockMachine();
      const { ReactRMachine, useR } = await createReactBareToolset(mock);

      function UseRConsumer() {
        useR("common");
        return null;
      }

      const { rerender } = render(
        <ReactRMachine locale="en">
          <UseRConsumer />
        </ReactRMachine>
      );

      rerender(
        <ReactRMachine locale="it">
          <UseRConsumer />
        </ReactRMachine>
      );

      expect((mock as any).hybridPickR).toHaveBeenCalledWith("it", "common");
    });

    it("throws the promise for Suspense when resource is not cached", async () => {
      const pending = new Promise<{ greeting: string }>(() => {});
      const mock = createMockMachine({
        hybridPickR: () => pending,
      });
      const { ReactRMachine, useR } = await createReactBareToolset(mock);

      let thrown: unknown;
      function Thrower() {
        try {
          // biome-ignore lint/correctness/useHookAtTopLevel: intentional — capturing the thrown promise
          useR("common");
        } catch (e) {
          thrown = e;
          throw e;
        }
        return null;
      }

      render(
        <ReactRMachine locale="en">
          <React19ErrorBoundary>
            <Thrower />
          </React19ErrorBoundary>
        </ReactRMachine>
      );

      expect(thrown).toBe(pending);
    });

    it("resolves from Suspense when the promise settles", async () => {
      const resource = { greeting: "hello" };
      let resolved = false;
      let resolve!: () => void;
      const pending = new Promise<{ greeting: string }>((r) => {
        resolve = () => {
          resolved = true;
          r(resource);
        };
      });
      const mock = createMockMachine({
        hybridPickR: () => (resolved ? resource : pending),
      });
      const { ReactRMachine, useR } = await createReactBareToolset(mock);

      function Consumer() {
        const r = useR("common");
        return <span data-testid="resource">{r.greeting}</span>;
      }

      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={<span data-testid="fallback">loading</span>}>
            <Consumer />
          </React.Suspense>
        </ReactRMachine>
      );

      expect(screen.getByTestId("fallback")).toBeDefined();

      await act(async () => {
        resolve();
      });

      expect(await screen.findByTestId("resource")).toBeDefined();
      expect(screen.getByTestId("resource").textContent).toBe("hello");
    });

    it("propagates a synchronous error from hybridPickR", async () => {
      const mock = createMockMachine({
        hybridPickR: () => {
          throw new Error("pickR exploded");
        },
      });
      const { ReactRMachine, useR } = await createReactBareToolset(mock);

      expect(() =>
        renderHook(() => useR("common"), {
          wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
        })
      ).toThrow("pickR exploded");
    });

    it("passes a different namespace to hybridPickR", async () => {
      const navResource = { home: "Home" };
      const mock = createMockMachine({
        hybridPickR: (_locale, namespace) => (namespace === "nav" ? navResource : { greeting: "hello" }),
      });
      const { ReactRMachine, useR } = await createReactBareToolset(mock);

      const { result } = renderHook(() => useR("nav"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect(result.current).toBe(navResource);
      expect((mock as any).hybridPickR).toHaveBeenCalledWith("en", "nav");
    });
  });

  // -----------------------------------------------------------------------
  // useRKit
  // -----------------------------------------------------------------------

  describe("useRKit", () => {
    it("throws when used outside ReactRMachine", async () => {
      const { useRKit } = await createReactBareToolset(createMockMachine());
      expect(() => renderHook(() => useRKit("common", "nav"))).toThrow(RMachineError);
    });

    it("returns the resource kit synchronously when cached", async () => {
      const kit = [{ greeting: "hello" }, { home: "Home" }] as const;
      const mock = createMockMachine({
        hybridPickRKit: () => kit,
      });
      const { ReactRMachine, useRKit } = await createReactBareToolset(mock);

      const { result } = renderHook(() => useRKit("common", "nav"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect(result.current).toBe(kit);
    });

    it("calls hybridPickRKit with the current locale and namespaces", async () => {
      const mock = createMockMachine();
      const { ReactRMachine, useRKit } = await createReactBareToolset(mock);

      renderHook(() => useRKit("common", "nav"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect((mock as any).hybridPickRKit).toHaveBeenCalledWith("en", "common", "nav");
    });

    it("calls hybridPickRKit with a single namespace", async () => {
      const mock = createMockMachine({
        hybridPickRKit: () => [{ greeting: "hello" }],
      });
      const { ReactRMachine, useRKit } = await createReactBareToolset(mock);

      renderHook(() => useRKit("common"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect((mock as any).hybridPickRKit).toHaveBeenCalledWith("en", "common");
    });

    it("throws the promise for Suspense when resources are not cached", async () => {
      const pending = new Promise<unknown>(() => {});
      const mock = createMockMachine({
        hybridPickRKit: () => pending,
      });
      const { ReactRMachine, useRKit } = await createReactBareToolset(mock);

      let thrown: unknown;
      function Thrower() {
        try {
          // biome-ignore lint/correctness/useHookAtTopLevel: intentional — capturing the thrown promise
          useRKit("common", "nav");
        } catch (e) {
          thrown = e;
          throw e;
        }
        return null;
      }

      render(
        <ReactRMachine locale="en">
          <React19ErrorBoundary>
            <Thrower />
          </React19ErrorBoundary>
        </ReactRMachine>
      );

      expect(thrown).toBe(pending);
    });

    it("resolves from Suspense when the promise settles", async () => {
      const kit = [{ greeting: "hello" }, { home: "Home" }] as const;
      let resolved = false;
      let resolve!: () => void;
      const pending = new Promise<unknown>((r) => {
        resolve = () => {
          resolved = true;
          r(kit);
        };
      });
      const mock = createMockMachine({
        hybridPickRKit: () => (resolved ? kit : pending),
      });
      const { ReactRMachine, useRKit } = await createReactBareToolset(mock);

      function Consumer() {
        const [common] = useRKit("common", "nav");
        return <span data-testid="resource">{common.greeting}</span>;
      }

      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={<span data-testid="fallback">loading</span>}>
            <Consumer />
          </React.Suspense>
        </ReactRMachine>
      );

      expect(screen.getByTestId("fallback")).toBeDefined();

      await act(async () => {
        resolve();
      });

      expect(await screen.findByTestId("resource")).toBeDefined();
      expect(screen.getByTestId("resource").textContent).toBe("hello");
    });

    it("propagates a synchronous error from hybridPickRKit", async () => {
      const mock = createMockMachine({
        hybridPickRKit: () => {
          throw new Error("pickRKit exploded");
        },
      });
      const { ReactRMachine, useRKit } = await createReactBareToolset(mock);

      expect(() =>
        renderHook(() => useRKit("common", "nav"), {
          wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
        })
      ).toThrow("pickRKit exploded");
    });

    it("calls hybridPickRKit with updated locale after re-render", async () => {
      const mock = createMockMachine();
      const { ReactRMachine, useRKit } = await createReactBareToolset(mock);

      function UseRKitConsumer() {
        useRKit("common", "nav");
        return null;
      }

      const { rerender } = render(
        <ReactRMachine locale="en">
          <UseRKitConsumer />
        </ReactRMachine>
      );

      rerender(
        <ReactRMachine locale="it">
          <UseRKitConsumer />
        </ReactRMachine>
      );

      expect((mock as any).hybridPickRKit).toHaveBeenCalledWith("it", "common", "nav");
    });
  });
});

// ---------------------------------------------------------------------------
// Minimal error boundary to catch thrown promises without React 19 crashing
// ---------------------------------------------------------------------------

import React from "react";

class React19ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
