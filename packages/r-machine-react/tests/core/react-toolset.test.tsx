import { act, cleanup, render, screen } from "@testing-library/react";
import { ERR_UNKNOWN_LOCALE, RMachineError } from "r-machine/errors";
import type { ReactNode } from "react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ERR_CONTEXT_NOT_FOUND } from "#r-machine/react/errors";
import { createReactToolset } from "../../src/core/react-toolset.js";
import { createMockImpl } from "../_fixtures/mock-impl.js";
import { type CreateMockMachineOptions, createMockMachine, spies } from "../_fixtures/mock-machine.js";

afterEach(cleanup);

type Ctx = { locale: string; setLocale: (l: string) => void | Promise<void> };
type Toolset = Awaited<ReturnType<typeof createReactToolset>>;
type AnyPlug = (...a: unknown[]) => { useR: () => unknown };

// createReactToolset wraps the bare toolset with an enhanced ReactRMachine that
// owns the locale via the ReactImpl (readLocale/writeLocale), wraps children in
// Suspense, and updates locale optimistically on $.setLocale. Locale/setLocale
// are read off the `$` context returned by `Plug().useR()`.

interface ToolsetOptions {
  readLocale?: () => string | Promise<string>;
  writeLocale?: (l: string) => void | Promise<void>;
  machine?: CreateMockMachineOptions;
}

function toolsetWith(opts: ToolsetOptions = {}) {
  const machine = createMockMachine(opts.machine ?? {});
  // Only forward defined overrides — `exactOptionalPropertyTypes` rejects
  // explicit `undefined` for optional props.
  const impl = createMockImpl({
    ...(opts.readLocale ? { readLocale: opts.readLocale } : {}),
    ...(opts.writeLocale ? { writeLocale: opts.writeLocale } : {}),
  });
  return { machine, toolset: createReactToolset(machine as never, {} as never, impl) };
}

// Renders a `$`-capturing probe inside the enhanced provider; returns a getter
// for the latest captured context.
async function mountCtx(t: Toolset, props: Record<string, unknown> = {}): Promise<() => Ctx> {
  let ctx: Ctx | undefined;
  function Probe() {
    const { $ } = (t.Plug as () => { useR: () => { $: Ctx } })().useR();
    ctx = $;
    return <span data-testid="locale">{$.locale}</span>;
  }
  await act(async () => {
    render(
      <t.ReactRMachine {...props}>
        <Probe />
      </t.ReactRMachine>
    );
  });
  return () => ctx as Ctx;
}

describe("createReactToolset › ReactRMachine (sync readLocale)", () => {
  it("renders children and passes the readLocale value as $.locale", async () => {
    const { toolset } = toolsetWith({ readLocale: () => "it" });
    const getCtx = await mountCtx(await toolset);
    expect(screen.getByTestId("locale").textContent).toBe("it");
    expect(getCtx().locale).toBe("it");
  });

  it("calls readLocale once per mount", async () => {
    const readLocale = vi.fn(() => "en");
    const { toolset } = toolsetWith({ readLocale });
    await mountCtx(await toolset);
    expect(readLocale).toHaveBeenCalledTimes(1);
  });

  // Intentional pattern: try/catch + expect.unreachable — do not simplify.
  it("propagates a synchronous error thrown by readLocale", async () => {
    const { ReactRMachine } = await toolsetWith({
      readLocale: () => {
        throw new Error("readLocale exploded");
      },
    }).toolset;
    try {
      render(
        <ReactRMachine>
          <div>child</div>
        </ReactRMachine>
      );
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as Error).message).toContain("readLocale exploded");
    }
  });
});

describe("createReactToolset › ReactRMachine (async readLocale)", () => {
  it("shows the fallback while pending, then renders with the resolved locale", async () => {
    let resolveLocale!: (l: string) => void;
    const localePromise = new Promise<string>((r) => {
      resolveLocale = r;
    });
    const { toolset } = toolsetWith({ readLocale: () => localePromise });
    const t = await toolset;

    function LocaleDisplay() {
      const { $ } = (t.Plug as () => { useR: () => { $: Ctx } })().useR();
      return <span data-testid="locale">{$.locale}</span>;
    }

    await act(async () => {
      render(
        <t.ReactRMachine Suspense={React.Suspense} fallback={<div>loading...</div>}>
          <LocaleDisplay />
        </t.ReactRMachine>
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

  it("propagates a rejection from async readLocale to an error boundary", async () => {
    const { ReactRMachine } = await toolsetWith({
      readLocale: () => Promise.reject(new Error("read rejected")),
    }).toolset;

    let caught: unknown;
    await act(async () => {
      render(
        <React19ErrorBoundaryCapture onError={(e) => (caught = e)}>
          <ReactRMachine Suspense={React.Suspense} fallback={<div>loading</div>}>
            <div>child</div>
          </ReactRMachine>
        </React19ErrorBoundaryCapture>
      );
    });
    expect((caught as Error)?.message).toContain("read rejected");
  });
});

describe("createReactToolset › ReactRMachine (Suspense prop)", () => {
  it("uses DelayedSuspense by default — no fallback flashes for a sync mount", async () => {
    const { toolset } = toolsetWith({ readLocale: () => "en" });
    const t = await toolset;
    await act(async () => {
      render(
        <t.ReactRMachine fallback={<div>fallback</div>}>
          <div>child</div>
        </t.ReactRMachine>
      );
    });
    expect(screen.getByText("child")).toBeDefined();
    expect(screen.queryByText("fallback")).toBeNull();
  });

  // NB: DelayedSuspense's fallback-delay timing is covered directly in
  // tests/utils/delayed-suspense.test.tsx; here we only assert it is the
  // default wrapper (above) and that the Suspense prop overrides it (below).

  it("uses a custom Suspense component when provided", async () => {
    const { ReactRMachine } = await toolsetWith({ readLocale: () => new Promise<string>(() => {}) }).toolset;
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

  it("renders without a Suspense wrapper when Suspense is null", async () => {
    const { ReactRMachine } = await toolsetWith({ readLocale: () => "en" }).toolset;
    render(
      <ReactRMachine Suspense={null}>
        <div>no-suspense-child</div>
      </ReactRMachine>
    );
    screen.getByText("no-suspense-child");
  });

  it("passes the fallback to the Suspense component", async () => {
    const { ReactRMachine } = await toolsetWith({ readLocale: () => new Promise<string>(() => {}) }).toolset;
    await act(async () => {
      render(
        <ReactRMachine Suspense={React.Suspense} fallback={<div>my-fallback</div>}>
          <div>child</div>
        </ReactRMachine>
      );
    });
    screen.getByText("my-fallback");
  });
});

describe("createReactToolset › $.setLocale", () => {
  // Intentional pattern: try/catch + expect.unreachable — do not simplify.
  it("throws ERR_CONTEXT_NOT_FOUND when used outside ReactRMachine", async () => {
    const { Plug } = await toolsetWith().toolset;
    function Orphan() {
      (Plug as AnyPlug)().useR();
      return null;
    }
    try {
      render(<Orphan />);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
    }
  });

  it("is a no-op when the new locale equals the current locale", async () => {
    const writeLocale = vi.fn();
    const getCtx = await mountCtx(await toolsetWith({ readLocale: () => "en", writeLocale }).toolset);
    await act(async () => {
      await getCtx().setLocale("en");
    });
    expect(writeLocale).not.toHaveBeenCalled();
  });

  it("calls impl.writeLocale and updates $.locale optimistically", async () => {
    const writeLocale = vi.fn();
    const getCtx = await mountCtx(await toolsetWith({ readLocale: () => "en", writeLocale }).toolset);

    await act(async () => {
      await getCtx().setLocale("it");
    });
    expect(writeLocale).toHaveBeenCalledWith("it");
    expect(screen.getByTestId("locale").textContent).toBe("it");
  });

  it("updates the locale optimistically even when writeLocale throws / rejects", async () => {
    const throwing = await mountCtx(
      await toolsetWith({
        readLocale: () => "en",
        writeLocale: () => {
          throw new Error("sync boom");
        },
      }).toolset
    );
    await act(async () => {
      await Promise.resolve(throwing().setLocale("it")).catch(() => {});
    });
    expect(screen.getByTestId("locale").textContent).toBe("it");

    cleanup();
    const rejecting = await mountCtx(
      await toolsetWith({ readLocale: () => "en", writeLocale: () => Promise.reject(new Error("async boom")) }).toolset
    );
    await act(async () => {
      await Promise.resolve(rejecting().setLocale("it")).catch(() => {});
    });
    expect(screen.getByTestId("locale").textContent).toBe("it");
  });

  // Intentional pattern: try/catch + expect.unreachable — do not simplify.
  it("throws RMachineError(ERR_UNKNOWN_LOCALE) for an invalid locale, with the locale in the message", async () => {
    const getCtx = await mountCtx(await toolsetWith({ readLocale: () => "en", writeLocale: vi.fn() }).toolset);
    try {
      await getCtx().setLocale("xx");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineError);
      expect((error as RMachineError).message).toContain("xx");
      // The bare $.setLocale throws the raw validation error (code carried,
      // not re-wrapped) — consistent with the bare toolset.
      expect(error).toHaveProperty("code", ERR_UNKNOWN_LOCALE);
    }
  });
});

describe("createReactToolset › resource resolution", () => {
  it("re-fetches resources (getGateWire) with the new locale after setLocale", async () => {
    const { machine, toolset } = toolsetWith({ readLocale: () => "en", writeLocale: vi.fn() });
    const t = await toolset;
    let setLocale!: (l: string) => Promise<void>;
    function Consumer() {
      const [, $] = (t.Plug as unknown as (...a: unknown[]) => { useR: () => [unknown, Ctx] })("common").useR();
      setLocale = $.setLocale as (l: string) => Promise<void>;
      return null;
    }
    await act(async () => {
      render(
        <t.ReactRMachine>
          <Consumer />
        </t.ReactRMachine>
      );
    });
    expect(spies(machine).getGateWire).toHaveBeenCalledWith({}, ["common"], "en", expect.any(Function), undefined);

    await act(async () => {
      await setLocale("it");
    });
    expect(spies(machine).getGateWire).toHaveBeenCalledWith({}, ["common"], "it", expect.any(Function), undefined);
  });
});

describe("createReactToolset › integration", () => {
  it("full flow: readLocale → render → setLocale → writeLocale + optimistic UI", async () => {
    const writeLocale = vi.fn();
    const { toolset } = toolsetWith({
      readLocale: () => "en",
      writeLocale,
      machine: { resolve: (_ns, locale) => ({ greeting: locale === "en" ? "hello" : "ciao" }) },
    });
    const t = await toolset;

    let setLocale!: (l: string) => Promise<void>;
    function App() {
      const [common, $] = (t.Plug as unknown as (...a: unknown[]) => { useR: () => [{ greeting: string }, Ctx] })(
        "common"
      ).useR();
      setLocale = $.setLocale as (l: string) => Promise<void>;
      return (
        <>
          <span data-testid="locale">{$.locale}</span>
          <span data-testid="greeting">{common.greeting}</span>
        </>
      );
    }

    await act(async () => {
      render(
        <t.ReactRMachine>
          <App />
        </t.ReactRMachine>
      );
    });
    expect(screen.getByTestId("locale").textContent).toBe("en");
    expect(screen.getByTestId("greeting").textContent).toBe("hello");

    await act(async () => {
      await setLocale("it");
    });
    expect(writeLocale).toHaveBeenCalledWith("it");
    expect(screen.getByTestId("locale").textContent).toBe("it");
    expect(screen.getByTestId("greeting").textContent).toBe("ciao");
  });

  it("independent toolset instances have isolated contexts", async () => {
    const a = await toolsetWith({ readLocale: () => "en" }).toolset;
    const b = await toolsetWith({ readLocale: () => "it" }).toolset;

    function Probe({ t, id }: { t: Toolset; id: string }) {
      const { $ } = (t.Plug as () => { useR: () => { $: Ctx } })().useR();
      return <span data-testid={id}>{$.locale}</span>;
    }

    await act(async () => {
      render(
        <>
          <a.ReactRMachine>
            <Probe t={a} id="a" />
          </a.ReactRMachine>
          <b.ReactRMachine>
            <Probe t={b} id="b" />
          </b.ReactRMachine>
        </>
      );
    });
    expect(screen.getByTestId("a").textContent).toBe("en");
    expect(screen.getByTestId("b").textContent).toBe("it");
  });

  it("does not error when unmounted during an async writeLocale", async () => {
    let resolveWrite!: () => void;
    const writeLocale = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolveWrite = r;
        })
    );
    const { toolset } = toolsetWith({ readLocale: () => "en", writeLocale });
    const t = await toolset;
    let setLocale!: (l: string) => Promise<void>;
    function App() {
      const { $ } = (t.Plug as () => { useR: () => { $: Ctx } })().useR();
      setLocale = $.setLocale as (l: string) => Promise<void>;
      return null;
    }
    const { unmount } = await (async () => {
      let utils!: ReturnType<typeof render>;
      await act(async () => {
        utils = render(
          <t.ReactRMachine>
            <App />
          </t.ReactRMachine>
        );
      });
      return utils;
    })();

    await act(async () => {
      void setLocale("it");
      unmount();
      resolveWrite();
    });
    // No unhandled error / warning means the test passes.
    expect(writeLocale).toHaveBeenCalledWith("it");
  });

  it("completes a locale switch when setLocale is wrapped in startTransition", async () => {
    const { toolset } = toolsetWith({ readLocale: () => "en", writeLocale: vi.fn() });
    const t = await toolset;
    let setLocale!: (l: string) => Promise<void>;
    function App() {
      const { $ } = (t.Plug as () => { useR: () => { $: Ctx } })().useR();
      setLocale = $.setLocale as (l: string) => Promise<void>;
      return <span data-testid="locale">{$.locale}</span>;
    }
    await act(async () => {
      render(
        <t.ReactRMachine>
          <App />
        </t.ReactRMachine>
      );
    });

    await act(async () => {
      React.startTransition(() => {
        void setLocale("it");
      });
    });
    expect(screen.getByTestId("locale").textContent).toBe("it");
  });
});

// Minimal error boundary that reports the caught error (avoids depending on the
// shared boundary's render-null behavior for assertions).
class React19ErrorBoundaryCapture extends React.Component<
  { children: ReactNode; onError: (e: unknown) => void },
  { hasError: boolean }
> {
  override state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  override componentDidCatch(error: unknown) {
    this.props.onError(error);
  }
  override render() {
    return this.state.hasError ? null : this.props.children;
  }
}
