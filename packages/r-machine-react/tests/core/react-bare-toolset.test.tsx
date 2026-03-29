import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { RMachineError } from "r-machine/errors";
import type { ReactNode } from "react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "#r-machine/react/errors";
import { createReactBareToolset } from "../../src/core/react-bare-toolset.js";
import { createMockMachine, spies } from "../_fixtures/mock-machine.js";
import { React19ErrorBoundary } from "../_fixtures/react19-error-boundary.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// createReactBareToolset
// ---------------------------------------------------------------------------

describe("createReactBareToolset", () => {
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

      screen.getByText("child content");
    });

    // Intentional pattern: try/catch + expect.unreachable allows multiple granular
    // assertions on the caught error (type, code, innerError). Do not simplify.
    it("throws RMachineError for an invalid locale", async () => {
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
      }
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

    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
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

      vi.mocked(mock.localeHelper.validateLocale).mockClear();
      ReactRMachine.probe(undefined);

      expect(mock.localeHelper.validateLocale).not.toHaveBeenCalled();
    });

    it("calls validateLocale when locale is an empty string", async () => {
      const mock = createMockMachine();
      const { ReactRMachine } = await createReactBareToolset(mock);

      vi.mocked(mock.localeHelper.validateLocale).mockClear();
      ReactRMachine.probe("");

      expect(mock.localeHelper.validateLocale).toHaveBeenCalledWith("");
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

    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
    it("throws when used outside ReactRMachine", async () => {
      const { useLocale } = await createReactBareToolset(createMockMachine());

      try {
        renderHook(() => useLocale());
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
      }
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
    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
    it("throws when used outside ReactRMachine", async () => {
      const { useSetLocale } = await createReactBareToolset(createMockMachine());
      try {
        renderHook(() => useSetLocale());
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
      }
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

    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
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

      try {
        await act(async () => {
          await result.current("xx");
        });
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
      }

      expect(writeLocale).not.toHaveBeenCalled();
    });

    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
    it("throws when no writeLocale function is provided", async () => {
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      try {
        await act(async () => {
          await result.current("it");
        });
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect(error).toHaveProperty("code", ERR_MISSING_WRITE_LOCALE);
      }
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

    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
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

    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
    it("throws ERR_MISSING_WRITE_LOCALE after writeLocale prop is removed", async () => {
      const writeLocale = vi.fn();
      const { ReactRMachine, useSetLocale } = await createReactBareToolset(createMockMachine());

      let currentWrapper: ({ children }: { children: ReactNode }) => React.JSX.Element;
      currentWrapper = ({ children }: { children: ReactNode }) => (
        <ReactRMachine locale="en" writeLocale={writeLocale}>
          {children}
        </ReactRMachine>
      );

      const { result, rerender } = renderHook(() => useSetLocale(), {
        wrapper: (props: { children: ReactNode }) => currentWrapper(props),
      });

      // Remove writeLocale on rerender
      currentWrapper = ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>;
      rerender();

      try {
        await act(async () => {
          await result.current("it");
        });
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect(error).toHaveProperty("code", ERR_MISSING_WRITE_LOCALE);
      }
    });
  });

  // -----------------------------------------------------------------------
  // useR
  // -----------------------------------------------------------------------

  describe("useR", () => {
    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
    it("throws when used outside ReactRMachine", async () => {
      const { useR } = await createReactBareToolset(createMockMachine());
      try {
        renderHook(() => useR("common"));
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
      }
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

      expect(spies(mock).hybridPickR).toHaveBeenCalledWith("en", "common");
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

      expect(spies(mock).hybridPickR).toHaveBeenCalledWith("it", "common");
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

      screen.getByTestId("fallback");

      await act(async () => {
        resolve();
      });

      expect((await screen.findByTestId("resource")).textContent).toBe("hello");
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
      expect(spies(mock).hybridPickR).toHaveBeenCalledWith("en", "nav");
    });
  });

  // -----------------------------------------------------------------------
  // useRKit
  // -----------------------------------------------------------------------

  describe("useRKit", () => {
    // Intentional pattern: try/catch + expect.unreachable — do not simplify.
    it("throws when used outside ReactRMachine", async () => {
      const { useRKit } = await createReactBareToolset(createMockMachine());
      try {
        renderHook(() => useRKit("common", "nav"));
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
      }
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

      expect(spies(mock).hybridPickRKit).toHaveBeenCalledWith("en", "common", "nav");
    });

    it("calls hybridPickRKit with a single namespace", async () => {
      const mock = createMockMachine({
        hybridPickRKit: () => [{ greeting: "hello" }],
      });
      const { ReactRMachine, useRKit } = await createReactBareToolset(mock);

      renderHook(() => useRKit("common"), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine locale="en">{children}</ReactRMachine>,
      });

      expect(spies(mock).hybridPickRKit).toHaveBeenCalledWith("en", "common");
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

      screen.getByTestId("fallback");

      await act(async () => {
        resolve();
      });

      expect((await screen.findByTestId("resource")).textContent).toBe("hello");
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

      expect(spies(mock).hybridPickRKit).toHaveBeenCalledWith("it", "common", "nav");
    });
  });
});
