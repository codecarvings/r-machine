// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { RMachineError, RMachineUsageError } from "r-machine/errors";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextAppClientImpl, NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import { createNextAppClientToolset } from "../../../src/core/app/next-app-client-toolset.js";
import type { TestLocale } from "../../_fixtures/constants.js";
import { expectAsyncError } from "../../_fixtures/expect-error.js";
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

function createMockImpl(overrides: Partial<NextAppClientImpl<TestLocale>> = {}): NextAppClientImpl<TestLocale> {
  return {
    onLoad: overrides.onLoad === undefined ? undefined : overrides.onLoad,
    writeLocale: overrides.writeLocale ?? vi.fn(),
    createPathComposer: overrides.createPathComposer ?? (() => (() => "/") as any),
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
  // -----------------------------------------------------------------------
  // NextClientRMachine
  // -----------------------------------------------------------------------

  describe("NextClientRMachine", () => {
    it("renders children", async () => {
      const { NextClientRMachine } = await createNextAppClientToolset(createMockMachine(), {}, createMockImpl());

      render(
        <NextClientRMachine locale="en">
          <div>child content</div>
        </NextClientRMachine>
      );

      screen.getByText("child content");
    });

    it("calls onLoad on mount with the locale", async () => {
      const onLoad = vi.fn();
      const { NextClientRMachine } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ onLoad })
      );

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
        {},
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
      const { NextClientRMachine } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ onLoad })
      );

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
      const { NextClientRMachine } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ onLoad })
      );

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
      const { NextClientRMachine } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ onLoad })
      );

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

    it("provides locale to children via ClientPlug $.locale", async () => {
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl()
      );

      function LocaleDisplay() {
        const { $ } = (ClientPlug as unknown as () => { useR: () => { $: { locale: string } } })().useR();
        return <span data-testid="locale">{$.locale}</span>;
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
  // ClientPlug — $.setLocale
  // -----------------------------------------------------------------------

  describe("ClientPlug › $.setLocale", () => {
    type AnyCtx = { locale: string; setLocale: (l: string) => Promise<void>; getPath: unknown };

    function mountCtx(
      NextClientRMachine: NextAppClientRMachine<TestLocale>,
      ClientPlug: unknown,
      locale: TestLocale = "en"
    ): () => AnyCtx {
      let ctx: AnyCtx | undefined;
      function Probe() {
        const { $ } = (ClientPlug as () => { useR: () => { $: AnyCtx } })().useR();
        ctx = $;
        return null;
      }
      render(
        <NextClientRMachine locale={locale}>
          <Probe />
        </NextClientRMachine>
      );
      return () => ctx as AnyCtx;
    }

    it("calls writeLocale with current locale, new locale, pathname, and router", async () => {
      const writeLocale = vi.fn();
      currentPathname = "/about";

      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      await act(async () => {
        await getCtx().setLocale("it");
      });

      expect(writeLocale).toHaveBeenCalledWith("en", "it", "/about", mockRouter);
    });

    it("throws RMachineUsageError for an invalid locale", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      await expect(
        act(async () => {
          await getCtx().setLocale("xx");
        })
      ).rejects.toBeInstanceOf(RMachineUsageError);
    });

    it("includes the invalid locale in the error message", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      await expect(
        act(async () => {
          await getCtx().setLocale("xx");
        })
      ).rejects.toThrow(/invalid locale.*xx/i);
    });

    it("wraps the validation error as innerError", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      const error = await expectAsyncError(
        () =>
          act(async () => {
            await getCtx().setLocale("xx");
          }),
        RMachineUsageError
      );
      expect(error.innerError).toBeInstanceOf(RMachineError);
    });

    it("does not call writeLocale when locale is invalid", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      try {
        await act(async () => {
          await getCtx().setLocale("xx");
        });
      } catch {
        // expected
      }

      expect(writeLocale).not.toHaveBeenCalled();
    });

    it("still calls writeLocale when new locale equals current locale", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      await act(async () => {
        await getCtx().setLocale("en");
      });

      expect(writeLocale).toHaveBeenCalledWith("en", "en", "/", mockRouter);
    });

    it("handles a synchronous writeLocale", async () => {
      const writeLocale = vi.fn();
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      await act(async () => {
        await getCtx().setLocale("it");
      });

      expect(writeLocale).toHaveBeenCalledWith("en", "it", "/", mockRouter);
    });

    it("awaits an async writeLocale", async () => {
      const order: string[] = [];
      const asyncWriteLocale = vi.fn(async () => {
        await new Promise<void>((r) => setTimeout(r, 10));
        order.push("writeLocale-done");
      });
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale: asyncWriteLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      await act(async () => {
        await getCtx().setLocale("it");
        order.push("setLocale-done");
      });

      expect(asyncWriteLocale).toHaveBeenCalled();
      expect(order).toEqual(["writeLocale-done", "setLocale-done"]);
    });

    it("propagates a synchronous error thrown by writeLocale", async () => {
      const writeLocale = vi.fn(() => {
        throw new Error("storage failure");
      });
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      await expect(
        act(async () => {
          await getCtx().setLocale("it");
        })
      ).rejects.toThrow("storage failure");
    });

    it("propagates a rejected promise from writeLocale", async () => {
      const writeLocale = vi.fn(() => Promise.reject(new Error("network error")));
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ writeLocale })
      );

      const getCtx = mountCtx(NextClientRMachine, ClientPlug);

      await expect(
        act(async () => {
          await getCtx().setLocale("it");
        })
      ).rejects.toThrow("network error");
    });
  });

  // -----------------------------------------------------------------------
  // ClientPlug — resource resolution
  // -----------------------------------------------------------------------

  describe("ClientPlug › resource resolution", () => {
    it("resolves the resource for a namespace via NextClientRMachine context", async () => {
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine({ resolve: (ns) => (ns === "common" ? { greeting: "hello" } : { ns }) }),
        {},
        createMockImpl()
      );

      function ResourceDisplay() {
        const [common] = (ClientPlug as unknown as (...a: unknown[]) => { useR: () => [{ greeting: string }] })(
          "common"
        ).useR();
        return <span data-testid="resource">{common.greeting}</span>;
      }

      await act(async () => {
        render(
          <NextClientRMachine locale="en">
            <ResourceDisplay />
          </NextClientRMachine>
        );
      });

      expect(screen.getByTestId("resource").textContent).toBe("hello");
    });

    it("returns the default surface shape (ns: string) for namespace deps", async () => {
      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl()
      );

      let captured: unknown;
      function Probe() {
        const [common] = (ClientPlug as unknown as (...a: unknown[]) => { useR: () => [unknown] })("common").useR();
        captured = common;
        return null;
      }

      await act(async () => {
        render(
          <NextClientRMachine locale="en">
            <Probe />
          </NextClientRMachine>
        );
      });

      expect(captured).toEqual({ ns: "common" });
    });
  });

  // -----------------------------------------------------------------------
  // ClientPlug — $.getPath
  // -----------------------------------------------------------------------

  describe("ClientPlug › $.getPath", () => {
    it("delegates to impl.createPathComposer with the current locale", async () => {
      const composerFn = vi.fn(() => "/composed");
      const createPathComposer = vi.fn(() => composerFn);

      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ createPathComposer })
      );

      type AnyCtx = { locale: string; getPath: ((...args: unknown[]) => string) | undefined };
      let capturedCtx: AnyCtx | undefined;
      function Probe() {
        const { $ } = (ClientPlug as () => { useR: () => { $: AnyCtx } })().useR();
        capturedCtx = $;
        return null;
      }

      await act(async () => {
        render(
          <NextClientRMachine locale="en">
            <Probe />
          </NextClientRMachine>
        );
      });

      expect(createPathComposer).toHaveBeenCalledWith("en");
      expect(capturedCtx?.getPath).toBe(composerFn);
    });

    it("updates getPath when locale changes", async () => {
      const enComposer = vi.fn(() => "/en-path");
      const itComposer = vi.fn(() => "/it-path");
      let callCount = 0;
      const createPathComposer = vi.fn(() => {
        callCount++;
        return callCount === 1 ? enComposer : itComposer;
      });

      const { NextClientRMachine, ClientPlug } = await createNextAppClientToolset(
        createMockMachine(),
        {},
        createMockImpl({ createPathComposer })
      );

      type AnyCtx = { locale: string; getPath: ((...args: unknown[]) => string) | undefined };
      let capturedCtx: AnyCtx | undefined;
      function Probe() {
        const { $ } = (ClientPlug as () => { useR: () => { $: AnyCtx } })().useR();
        capturedCtx = $;
        return null;
      }

      let rerender: (ui: ReactNode) => void;
      await act(async () => {
        ({ rerender } = render(
          <NextClientRMachine locale="en">
            <Probe />
          </NextClientRMachine>
        ));
      });

      expect(capturedCtx?.getPath).toBe(enComposer);

      await act(async () => {
        rerender(
          <NextClientRMachine locale="it">
            <Probe />
          </NextClientRMachine>
        );
      });

      expect(createPathComposer).toHaveBeenCalledWith("it");
      expect(capturedCtx?.getPath).toBe(itComposer);
    });
  });
});
