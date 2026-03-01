import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { RMachineError } from "r-machine/errors";
import type { ReactNode } from "react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ERR_CONTEXT_NOT_FOUND } from "#r-machine/react/errors";
import { createReactToolset } from "../../src/core/react-toolset.js";
import { createMockImpl } from "../_fixtures/mock-impl.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// createReactToolset
// ---------------------------------------------------------------------------

describe("createReactToolset", () => {
  it("returns a toolset with all expected members", async () => {
    const toolset = await createReactToolset(createMockMachine(), createMockImpl());

    expect(toolset).toHaveProperty("ReactRMachine");
    expect(toolset).toHaveProperty("useLocale");
    expect(toolset).toHaveProperty("useSetLocale");
    expect(toolset).toHaveProperty("useR");
    expect(toolset).toHaveProperty("useRKit");
  });

  // -----------------------------------------------------------------------
  // ReactRMachine — sync readLocale
  // -----------------------------------------------------------------------

  describe("ReactRMachine (sync readLocale)", () => {
    it("renders children when readLocale returns a string", async () => {
      const impl = createMockImpl({ readLocale: () => "en" });
      const { ReactRMachine } = await createReactToolset(createMockMachine(), impl);

      render(
        <ReactRMachine>
          <div>child content</div>
        </ReactRMachine>
      );

      screen.getByText("child content");
    });

    it("calls readLocale once per mount", async () => {
      const readLocale = vi.fn(() => "en");
      const impl = createMockImpl({ readLocale });
      const { ReactRMachine } = await createReactToolset(createMockMachine(), impl);

      const { rerender } = render(
        <ReactRMachine>
          <div>child</div>
        </ReactRMachine>
      );

      rerender(
        <ReactRMachine>
          <div>child</div>
        </ReactRMachine>
      );

      expect(readLocale).toHaveBeenCalledTimes(1);
    });

    it("passes the locale from readLocale to the inner provider", async () => {
      const impl = createMockImpl({ readLocale: () => "it" });
      const { ReactRMachine, useLocale } = await createReactToolset(createMockMachine(), impl);

      function LocaleDisplay() {
        return <span data-testid="locale">{useLocale()}</span>;
      }

      render(
        <ReactRMachine>
          <LocaleDisplay />
        </ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });
  });

  // -----------------------------------------------------------------------
  // ReactRMachine — async readLocale
  // -----------------------------------------------------------------------

  describe("ReactRMachine (async readLocale)", () => {
    const DELAY = 50;

    it("renders children with the resolved locale after async readLocale resolves", async () => {
      const localePromise = new Promise<string>((r) => setTimeout(() => r("it"), DELAY));
      const impl = createMockImpl({ readLocale: () => localePromise });
      const { ReactRMachine, useLocale } = await createReactToolset(createMockMachine(), impl);

      function LocaleDisplay() {
        return <span data-testid="locale">{useLocale()}</span>;
      }

      await act(async () => {
        render(
          <ReactRMachine Suspense={React.Suspense} fallback={<div>loading...</div>}>
            <LocaleDisplay />
          </ReactRMachine>
        );
        await localePromise;
      });

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });

    it("shows fallback while async readLocale is pending", async () => {
      let resolve!: (locale: string) => void;
      const localePromise = new Promise<string>((r) => {
        resolve = r;
      });
      const impl = createMockImpl({ readLocale: () => localePromise });
      const { ReactRMachine } = await createReactToolset(createMockMachine(), impl);

      await act(async () => {
        render(
          <ReactRMachine Suspense={React.Suspense} fallback={<div>loading...</div>}>
            <div>child content</div>
          </ReactRMachine>
        );
      });

      // Fallback should be visible while promise is pending
      screen.getByText("loading...");
      expect(screen.queryByText("child content")).toBeNull();

      // Resolve to prevent dangling promise warnings
      resolve("en");
      await act(async () => {
        await localePromise;
        await new Promise((r) => setTimeout(r, DELAY));
      });
    });
  });

  // -----------------------------------------------------------------------
  // ReactRMachine — Suspense prop
  // -----------------------------------------------------------------------

  describe("ReactRMachine (Suspense prop)", () => {
    it("uses DelayedSuspense by default when no Suspense prop is provided", async () => {
      const impl = createMockImpl({ readLocale: () => "en" });
      const { ReactRMachine, useLocale } = await createReactToolset(createMockMachine(), impl);

      function LocaleDisplay() {
        return <span data-testid="locale">{useLocale()}</span>;
      }

      // With sync readLocale and default Suspense, children render normally
      // (no suspension occurs, so DelayedSuspense is a transparent wrapper)
      render(
        <ReactRMachine fallback={<div>fallback</div>}>
          <LocaleDisplay />
        </ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("en");
      expect(screen.queryByText("fallback")).toBeNull();
    });

    it("delays fallback when using default Suspense with async resource loading", async () => {
      vi.useFakeTimers();

      const pending = new Promise<{ greeting: string }>(() => {});
      const mock = createMockMachine({ hybridPickR: () => pending });
      const impl = createMockImpl({ readLocale: () => "en" });
      const { ReactRMachine, useR } = await createReactToolset(mock, impl);

      function Consumer() {
        const r = useR("common");
        return <span>{r.greeting}</span>;
      }

      render(
        <ReactRMachine fallback={<div>delayed-fallback</div>}>
          <Consumer />
        </ReactRMachine>
      );

      // DelayedSuspense delays fallback — neither content nor fallback immediately
      expect(screen.queryByText("delayed-fallback")).toBeNull();

      // After delay (default 300ms), fallback appears
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      screen.getByText("delayed-fallback");

      vi.useRealTimers();
    });

    it("uses the custom Suspense component when provided", async () => {
      const impl = createMockImpl({
        readLocale: () => new Promise<string>(() => {}),
      });
      const { ReactRMachine } = await createReactToolset(createMockMachine(), impl);

      function CustomSuspense({ fallback, children }: { fallback?: ReactNode; children: ReactNode }) {
        return <React.Suspense fallback={<div>custom-wrapper: {fallback}</div>}>{children}</React.Suspense>;
      }

      await act(async () => {
        render(
          <ReactRMachine Suspense={CustomSuspense} fallback={<span>loading</span>}>
            <div>child</div>
          </ReactRMachine>
        );
      });

      screen.getByText(/custom-wrapper/);
    });

    it("renders without Suspense wrapper when Suspense is null", async () => {
      const impl = createMockImpl({ readLocale: () => "en" });
      const { ReactRMachine } = await createReactToolset(createMockMachine(), impl);

      render(
        <ReactRMachine Suspense={null}>
          <div>no-suspense-child</div>
        </ReactRMachine>
      );

      screen.getByText("no-suspense-child");
    });

    it("passes fallback to the Suspense component", async () => {
      const impl = createMockImpl({
        readLocale: () => new Promise<string>(() => {}),
      });
      const { ReactRMachine } = await createReactToolset(createMockMachine(), impl);

      await act(async () => {
        render(
          <ReactRMachine Suspense={React.Suspense} fallback={<div>my-fallback</div>}>
            <div>child</div>
          </ReactRMachine>
        );
      });

      screen.getByText("my-fallback");
    });

    it("renders undefined fallback when fallback is not specified", async () => {
      const impl = createMockImpl({
        readLocale: () => new Promise<string>(() => {}),
      });
      const { ReactRMachine } = await createReactToolset(createMockMachine(), impl);

      // Should not crash even without fallback
      await act(async () => {
        render(
          <ReactRMachine Suspense={React.Suspense}>
            <div>child</div>
          </ReactRMachine>
        );
      });

      // Content shouldn't appear while suspended
      expect(screen.queryByText("child")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // useLocale (inherited from ReactBareToolset)
  // -----------------------------------------------------------------------

  describe("useLocale", () => {
    it("returns the current locale from context", async () => {
      const impl = createMockImpl({ readLocale: () => "en" });
      const { ReactRMachine, useLocale } = await createReactToolset(createMockMachine(), impl);

      const { result } = renderHook(() => useLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine>{children}</ReactRMachine>,
      });

      expect(result.current).toBe("en");
    });
  });

  // -----------------------------------------------------------------------
  // useSetLocale
  // -----------------------------------------------------------------------

  describe("useSetLocale", () => {
    it("throws with a descriptive context-not-found message when used outside ReactRMachine", async () => {
      const { useSetLocale } = await createReactToolset(createMockMachine(), createMockImpl());
      try {
        renderHook(() => useSetLocale());
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
        expect(error).toHaveProperty("message", expect.stringMatching(/ReactToolsetContext not found/));
      }
    });

    it("is a no-op when the new locale equals the current locale", async () => {
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine>{children}</ReactRMachine>,
      });

      await act(async () => {
        await result.current("en");
      });

      expect(writeLocale).not.toHaveBeenCalled();
    });

    it("calls impl.writeLocale with the new locale", async () => {
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine>{children}</ReactRMachine>,
      });

      await act(async () => {
        await result.current("it");
      });

      expect(writeLocale).toHaveBeenCalledWith("it");
    });

    it("updates the locale in context after setLocale", async () => {
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useLocale, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      function LocaleSwitcher() {
        const locale = useLocale();
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="locale">{locale}</span>
            <button type="button" onClick={() => setLocale("it")}>
              switch
            </button>
          </>
        );
      }

      render(
        <ReactRMachine>
          <LocaleSwitcher />
        </ReactRMachine>
      );

      expect(screen.getByTestId("locale").textContent).toBe("en");

      await act(async () => {
        screen.getByText("switch").click();
      });

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });

    it("throws RMachineError when the new locale is invalid", async () => {
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine>{children}</ReactRMachine>,
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

    it("includes the invalid locale in the error message", async () => {
      const impl = createMockImpl({ readLocale: () => "en" });
      const { ReactRMachine, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine>{children}</ReactRMachine>,
      });

      await expect(
        act(async () => {
          await result.current("xx");
        })
      ).rejects.toThrow(/Cannot set invalid locale: "xx"/);
    });

    it("wraps the validation error as innerError", async () => {
      const impl = createMockImpl({ readLocale: () => "en" });
      const { ReactRMachine, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine>{children}</ReactRMachine>,
      });

      try {
        await act(async () => {
          await result.current("xx");
        });
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect((error as RMachineError).innerError).toBeInstanceOf(RMachineError);
      }
    });
  });

  // -----------------------------------------------------------------------
  // useR (inherited from ReactBareToolset, accessed through provider)
  // -----------------------------------------------------------------------

  describe("useR", () => {
    it("re-fetches resources after locale change", async () => {
      const mock = createMockMachine();
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useR, useSetLocale } = await createReactToolset(mock, impl);

      function Consumer() {
        const r = useR("common");
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="greeting">{r.greeting}</span>
            <button type="button" onClick={() => setLocale("it")}>
              switch
            </button>
          </>
        );
      }

      render(
        <ReactRMachine>
          <Consumer />
        </ReactRMachine>
      );

      await act(async () => {
        screen.getByText("switch").click();
      });

      expect((mock as any).hybridPickR).toHaveBeenCalledWith("it", "common");
    });
  });

  // -----------------------------------------------------------------------
  // useRKit (inherited from ReactBareToolset, accessed through provider)
  // -----------------------------------------------------------------------

  describe("useRKit", () => {
    it("re-fetches resources after locale change", async () => {
      const mock = createMockMachine();
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useRKit, useSetLocale } = await createReactToolset(mock, impl);

      function Consumer() {
        const [r] = useRKit("common");
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="greeting">{r.greeting}</span>
            <button type="button" onClick={() => setLocale("it")}>
              switch
            </button>
          </>
        );
      }

      render(
        <ReactRMachine>
          <Consumer />
        </ReactRMachine>
      );

      await act(async () => {
        screen.getByText("switch").click();
      });

      expect((mock as any).hybridPickRKit).toHaveBeenCalledWith("it", "common");
    });
  });

  // -----------------------------------------------------------------------
  // Integration tests
  // -----------------------------------------------------------------------

  describe("integration", () => {
    it("full flow: readLocale → render → setLocale → writeLocale", async () => {
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const mock = createMockMachine({
        hybridPickR: (locale) => ({ greeting: locale === "en" ? "hello" : "ciao" }),
      });
      const { ReactRMachine, useR, useLocale, useSetLocale } = await createReactToolset(mock, impl);

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
      expect(writeLocale).toHaveBeenCalledWith("it");
    });

    it("async readLocale → resolve → full interaction", async () => {
      const writeLocale = vi.fn();
      const localePromise = new Promise<string>((r) => setTimeout(() => r("en"), 50));
      const impl = createMockImpl({
        readLocale: () => localePromise,
        writeLocale,
      });
      const { ReactRMachine, useLocale, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      function App() {
        const locale = useLocale();
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="locale">{locale}</span>
            <button type="button" onClick={() => setLocale("it")}>
              switch
            </button>
          </>
        );
      }

      await act(async () => {
        render(
          <ReactRMachine Suspense={React.Suspense} fallback={<div>loading</div>}>
            <App />
          </ReactRMachine>
        );
        await localePromise;
      });

      expect(screen.getByTestId("locale").textContent).toBe("en");

      await act(async () => {
        screen.getByText("switch").click();
      });

      expect(screen.getByTestId("locale").textContent).toBe("it");
      expect(writeLocale).toHaveBeenCalledWith("it");
    });

    it("updates locale optimistically even when writeLocale throws synchronously", async () => {
      const writeLocale = vi.fn(() => {
        throw new Error("storage failure");
      });
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useLocale, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      let caughtError: unknown;
      function App() {
        const locale = useLocale();
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="locale">{locale}</span>
            <button
              type="button"
              onClick={() => {
                setLocale("it").catch((e) => {
                  caughtError = e;
                });
              }}
            >
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

      await act(async () => {
        screen.getByText("switch").click();
      });

      // Locale was updated optimistically before writeLocale threw
      expect(screen.getByTestId("locale").textContent).toBe("it");
      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toBe("storage failure");
    });

    it("updates locale optimistically even when writeLocale rejects", async () => {
      const writeLocale = vi.fn(() => Promise.reject(new Error("network error")));
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useLocale, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      let caughtError: unknown;
      function App() {
        const locale = useLocale();
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="locale">{locale}</span>
            <button
              type="button"
              onClick={() => {
                setLocale("it").catch((e) => {
                  caughtError = e;
                });
              }}
            >
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

      await act(async () => {
        screen.getByText("switch").click();
      });

      // Locale was updated optimistically before writeLocale rejected
      expect(screen.getByTestId("locale").textContent).toBe("it");
      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toBe("network error");
    });

    it("independent toolset instances have isolated contexts", async () => {
      const impl1 = createMockImpl({ readLocale: () => "en" });
      const impl2 = createMockImpl({ readLocale: () => "it" });
      const toolset1 = await createReactToolset(createMockMachine(), impl1);
      const toolset2 = await createReactToolset(createMockMachine(), impl2);

      function Display1() {
        return <span data-testid="l1">{toolset1.useLocale()}</span>;
      }
      function Display2() {
        return <span data-testid="l2">{toolset2.useLocale()}</span>;
      }

      render(
        <toolset1.ReactRMachine>
          <Display1 />
          <toolset2.ReactRMachine>
            <Display2 />
          </toolset2.ReactRMachine>
        </toolset1.ReactRMachine>
      );

      expect(screen.getByTestId("l1").textContent).toBe("en");
      expect(screen.getByTestId("l2").textContent).toBe("it");
    });

    it("multiple setLocale calls update correctly", async () => {
      const writeLocale = vi.fn();
      const impl = createMockImpl({ readLocale: () => "en", writeLocale });
      const { ReactRMachine, useLocale, useSetLocale } = await createReactToolset(createMockMachine(), impl);

      function App() {
        const locale = useLocale();
        const setLocale = useSetLocale();
        return (
          <>
            <span data-testid="locale">{locale}</span>
            <button type="button" data-testid="to-it" onClick={() => setLocale("it")}>
              to it
            </button>
            <button type="button" data-testid="to-en" onClick={() => setLocale("en")}>
              to en
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

      await act(async () => {
        screen.getByTestId("to-it").click();
      });
      expect(screen.getByTestId("locale").textContent).toBe("it");

      await act(async () => {
        screen.getByTestId("to-en").click();
      });
      expect(screen.getByTestId("locale").textContent).toBe("en");

      expect(writeLocale).toHaveBeenCalledTimes(2);
      expect(writeLocale).toHaveBeenNthCalledWith(1, "it");
      expect(writeLocale).toHaveBeenNthCalledWith(2, "en");
    });
  });
});
