// @vitest-environment jsdom

import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { RMachineError, RMachineUsageError } from "r-machine/errors";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextAppClientImpl } from "../../../src/core/app/next-app-client-toolset.js";
import { createNextAppClientToolset } from "../../../src/core/app/next-app-client-toolset.js";
import { createMockMachine } from "../../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// Next.js navigation mocks
// ---------------------------------------------------------------------------

let currentPathname = "/";

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => currentPathname,
}));

// ---------------------------------------------------------------------------
// Impl factory
// ---------------------------------------------------------------------------

function createMockImpl(overrides: Partial<NextAppClientImpl> = {}): NextAppClientImpl {
  return {
    onLoad: overrides.onLoad === undefined ? undefined : overrides.onLoad,
    writeLocale: overrides.writeLocale ?? vi.fn(),
    createUsePathComposer: overrides.createUsePathComposer ?? (() => () => (() => "/") as any),
  };
}

afterEach(() => {
  cleanup();
  currentPathname = "/";
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createNextAppClientToolset
// ---------------------------------------------------------------------------

describe("createNextAppClientToolset", () => {
  it("returns a toolset with all expected members", async () => {
    const toolset = await createNextAppClientToolset(createMockMachine(), createMockImpl());

    expect(toolset).toHaveProperty("useLocale");
    expect(toolset).toHaveProperty("useSetLocale");
    expect(toolset).toHaveProperty("usePathComposer");
    expect(toolset).toHaveProperty("NextClientRMachine");
    expect(toolset).toHaveProperty("useR");
    expect(toolset).toHaveProperty("useRKit");
  });

  it("does not include ReactRMachine", async () => {
    const toolset = await createNextAppClientToolset(createMockMachine(), createMockImpl());

    expect(toolset).not.toHaveProperty("ReactRMachine");
  });

  // -----------------------------------------------------------------------
  // NextClientRMachine
  // -----------------------------------------------------------------------

  describe("NextClientRMachine", () => {
    it("renders children", async () => {
      const { NextClientRMachine } = await createNextAppClientToolset(createMockMachine(), createMockImpl());

      render(
        <NextClientRMachine locale="en">
          <div>child content</div>
        </NextClientRMachine>
      );

      screen.getByText("child content");
    });

    it("calls onLoad on mount with the locale", async () => {
      const onLoad = vi.fn();
      const { NextClientRMachine } = await createNextAppClientToolset(createMockMachine(), createMockImpl({ onLoad }));

      await act(async () => {
        render(
          <NextClientRMachine locale="en">
            <div>child</div>
          </NextClientRMachine>
        );
      });

      expect(onLoad).toHaveBeenCalledWith("en");
      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it("does not throw when onLoad is undefined", async () => {
      const { NextClientRMachine } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ onLoad: undefined })
      );

      await act(async () => {
        render(
          <NextClientRMachine locale="en">
            <div>child</div>
          </NextClientRMachine>
        );
      });

      screen.getByText("child");
    });

    it("calls cleanup returned by onLoad on unmount", async () => {
      const cleanupFn = vi.fn();
      const onLoad = vi.fn(() => cleanupFn);
      const { NextClientRMachine } = await createNextAppClientToolset(createMockMachine(), createMockImpl({ onLoad }));

      let unmount: () => void;
      await act(async () => {
        ({ unmount } = render(
          <NextClientRMachine locale="en">
            <div>child</div>
          </NextClientRMachine>
        ));
      });

      expect(cleanupFn).not.toHaveBeenCalled();

      act(() => {
        unmount!();
      });

      expect(cleanupFn).toHaveBeenCalledTimes(1);
    });

    it("calls onLoad again when locale changes", async () => {
      const onLoad = vi.fn();
      const { NextClientRMachine } = await createNextAppClientToolset(createMockMachine(), createMockImpl({ onLoad }));

      let rerender: (ui: ReactNode) => void;
      await act(async () => {
        ({ rerender } = render(
          <NextClientRMachine locale="en">
            <div>child</div>
          </NextClientRMachine>
        ));
      });

      expect(onLoad).toHaveBeenCalledTimes(1);

      await act(async () => {
        rerender!(
          <NextClientRMachine locale="it">
            <div>child</div>
          </NextClientRMachine>
        );
      });

      expect(onLoad).toHaveBeenCalledTimes(2);
      expect(onLoad).toHaveBeenLastCalledWith("it");
    });

    it("calls cleanup from previous onLoad when locale changes", async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      let callCount = 0;
      const onLoad = vi.fn(() => {
        callCount++;
        return callCount === 1 ? cleanup1 : cleanup2;
      });
      const { NextClientRMachine } = await createNextAppClientToolset(createMockMachine(), createMockImpl({ onLoad }));

      let rerender: (ui: ReactNode) => void;
      await act(async () => {
        ({ rerender } = render(
          <NextClientRMachine locale="en">
            <div>child</div>
          </NextClientRMachine>
        ));
      });

      expect(cleanup1).not.toHaveBeenCalled();

      await act(async () => {
        rerender!(
          <NextClientRMachine locale="it">
            <div>child</div>
          </NextClientRMachine>
        );
      });

      expect(cleanup1).toHaveBeenCalledTimes(1);
    });

    it("provides locale context to children", async () => {
      const { NextClientRMachine, useLocale } = await createNextAppClientToolset(createMockMachine(), createMockImpl());

      function LocaleDisplay() {
        return <span data-testid="locale">{useLocale()}</span>;
      }

      await act(async () => {
        render(
          <NextClientRMachine locale="it">
            <LocaleDisplay />
          </NextClientRMachine>
        );
      });

      expect(screen.getByTestId("locale").textContent).toBe("it");
    });
  });

  // -----------------------------------------------------------------------
  // useSetLocale
  // -----------------------------------------------------------------------

  describe("useSetLocale", () => {
    it("calls writeLocale with current locale, new locale, pathname, and router", async () => {
      const writeLocale = vi.fn();
      currentPathname = "/about";

      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      await act(async () => {
        await result.current("it");
      });

      expect(writeLocale).toHaveBeenCalledWith("en", "it", "/about", mockRouter);
    });

    it("throws RMachineUsageError for an invalid locale", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      try {
        await act(async () => {
          await result.current("xx");
        });
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineUsageError);
      }
    });

    it("includes the invalid locale in the error message", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      await expect(
        act(async () => {
          await result.current("xx");
        })
      ).rejects.toThrow(/invalid locale.*xx/i);
    });

    it("wraps the validation error as innerError", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      try {
        await act(async () => {
          await result.current("xx");
        });
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineUsageError);
        expect((error as RMachineUsageError).innerError).toBeInstanceOf(RMachineError);
      }
    });

    it("does not call writeLocale when locale is invalid", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      try {
        await act(async () => {
          await result.current("xx");
        });
      } catch {
        // expected
      }

      expect(writeLocale).not.toHaveBeenCalled();
    });

    it("still calls writeLocale when new locale equals current locale", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      await act(async () => {
        await result.current("en");
      });

      expect(writeLocale).toHaveBeenCalledWith("en", "en", "/", mockRouter);
    });

    it("handles a synchronous writeLocale", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      await act(async () => {
        await result.current("it");
      });

      expect(writeLocale).toHaveBeenCalledWith("en", "it", "/", mockRouter);
    });

    it("awaits an async writeLocale", async () => {
      const order: string[] = [];
      const asyncWriteLocale = vi.fn(async () => {
        await new Promise<void>((r) => setTimeout(r, 10));
        order.push("writeLocale-done");
      });
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale: asyncWriteLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      await act(async () => {
        await result.current("it");
        order.push("setLocale-done");
      });

      expect(asyncWriteLocale).toHaveBeenCalled();
      expect(order).toEqual(["writeLocale-done", "setLocale-done"]);
    });

    it("propagates a synchronous error thrown by writeLocale", async () => {
      const writeLocale = vi.fn(() => {
        throw new Error("storage failure");
      });
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
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
      const { NextClientRMachine, useSetLocale } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ writeLocale })
      );

      const { result } = renderHook(() => useSetLocale(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
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
  // usePathComposer
  // -----------------------------------------------------------------------

  describe("usePathComposer", () => {
    it("delegates to impl.createUsePathComposer", async () => {
      const composerFn = vi.fn(() => "/composed");
      const usePathComposerHook = vi.fn(() => composerFn);
      const createUsePathComposer = vi.fn(() => usePathComposerHook);

      const { NextClientRMachine, usePathComposer } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ createUsePathComposer })
      );

      expect(createUsePathComposer).toHaveBeenCalledTimes(1);
      expect(createUsePathComposer).toHaveBeenCalledWith(expect.any(Function));

      const { result } = renderHook(() => usePathComposer(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="en">{children}</NextClientRMachine>
        ),
      });

      expect(result.current).toBe(composerFn);
    });

    it("passes useLocale as argument to createUsePathComposer", async () => {
      let capturedUseLocale: (() => string) | undefined;
      const createUsePathComposer = vi.fn((useLocale: () => string) => {
        capturedUseLocale = useLocale;
        return () => vi.fn(() => "/") as any;
      });

      const { NextClientRMachine } = await createNextAppClientToolset(
        createMockMachine(),
        createMockImpl({ createUsePathComposer })
      );

      const { result } = renderHook(() => capturedUseLocale!(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NextClientRMachine locale="it">{children}</NextClientRMachine>
        ),
      });

      expect(result.current).toBe("it");
    });
  });
});
