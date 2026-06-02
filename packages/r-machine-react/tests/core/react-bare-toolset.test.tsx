import { act, cleanup, render, screen } from "@testing-library/react";
import { RMachineError } from "r-machine/errors";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "#r-machine/react/errors";
import { createReactBareToolset } from "../../src/core/react-bare-toolset.js";
import { createFakeWire } from "../_fixtures/fake-wire.js";
import { type CreateMockMachineOptions, createMockMachine, spies } from "../_fixtures/mock-machine.js";

afterEach(cleanup);

type Ctx = { locale: string; setLocale: (l: string) => void | Promise<void> };
type BareToolset = Awaited<ReturnType<typeof createReactBareToolset>>;
// Loose views onto the (heavily generic) Plug for runtime assertions.
type AnyPlug = (...a: unknown[]) => { useR: () => unknown };

// In the current API the toolset exposes { ReactRMachine, Plug }. Locale and
// setLocale live on the `$` context returned by `Plug().useR()`; resources are
// resolved via `Plug("ns").useR()` (a `[...surfaces, $]` tuple). The mock's
// getWire returns synchronously-resolved wires, so consumers read without
// suspending — the "cached resource" path.

function make(overrides: CreateMockMachineOptions = {}) {
  const mock = createMockMachine(overrides);
  return { mock, toolset: createReactBareToolset(mock as never, {} as never) };
}

// Renders a probe that reads the `$` context via a no-dep Plug; returns a getter
// for the latest captured context.
function mountCtx(t: BareToolset, opts: { locale?: string; writeLocale?: (l: string) => unknown } = {}): () => Ctx {
  let ctx: Ctx | undefined;
  function Probe() {
    const { $ } = (t.Plug as () => { useR: () => { $: Ctx } })().useR();
    ctx = $;
    return <span data-testid="locale">{$.locale}</span>;
  }
  render(
    <t.ReactRMachine locale={opts.locale ?? "en"} writeLocale={opts.writeLocale as never}>
      <Probe />
    </t.ReactRMachine>
  );
  return () => ctx as Ctx;
}

describe("createReactBareToolset › ReactRMachine (provider)", () => {
  it("renders children when a valid locale is provided", async () => {
    const { ReactRMachine } = await make().toolset;
    render(<ReactRMachine locale="en">hello</ReactRMachine>);
    expect(screen.getByText("hello")).toBeDefined();
  });

  // Intentional pattern: try/catch + expect.unreachable — do not simplify.
  it("throws RMachineError for an invalid locale, with the locale in the message and a wrapped innerError", async () => {
    const { ReactRMachine } = await make().toolset;
    try {
      render(<ReactRMachine locale="xx">child</ReactRMachine>);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineError);
      expect((error as RMachineError).message).toContain("xx");
      expect((error as RMachineError).innerError).toBeDefined();
    }
  });

  it("inner provider overrides outer provider (locale read via $.locale)", async () => {
    const { ReactRMachine, Plug } = await make().toolset;
    function LocaleDisplay() {
      const { $ } = (Plug as () => { useR: () => { $: Ctx } })().useR();
      return <span data-testid="locale">{$.locale}</span>;
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

  it("memoizes the context value when locale and writeLocale are stable", async () => {
    const { ReactRMachine } = await make().toolset;
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
    expect(renderCount).toBe(1);
  });

  it("re-renders children when the locale prop changes", async () => {
    const { ReactRMachine, Plug } = await make().toolset;
    function LocaleDisplay() {
      const { $ } = (Plug as () => { useR: () => { $: Ctx } })().useR();
      return <span>{$.locale}</span>;
    }
    const { rerender } = render(
      <ReactRMachine locale="en">
        <LocaleDisplay />
      </ReactRMachine>
    );
    expect(screen.queryByText("en")).not.toBeNull();

    rerender(
      <ReactRMachine locale="it">
        <LocaleDisplay />
      </ReactRMachine>
    );
    expect(screen.queryByText("it")).not.toBeNull();
    expect(screen.queryByText("en")).toBeNull();
  });
});

describe("createReactBareToolset › ReactRMachine.probe", () => {
  it("returns the locale when valid, undefined when invalid / undefined / empty", async () => {
    const { ReactRMachine } = await make().toolset;
    expect(ReactRMachine.probe("en")).toBe("en");
    expect(ReactRMachine.probe("xx")).toBeUndefined();
    expect(ReactRMachine.probe(undefined)).toBeUndefined();
    expect(ReactRMachine.probe("")).toBeUndefined();
  });

  it("calls validateLocale for a defined locale but not for undefined", async () => {
    const { mock, toolset } = make();
    const { ReactRMachine } = await toolset;

    ReactRMachine.probe("en");
    expect(spies(mock).localeHelper.validateLocale).toHaveBeenCalledWith("en");

    spies(mock).localeHelper.validateLocale.mockClear();
    ReactRMachine.probe(undefined);
    expect(spies(mock).localeHelper.validateLocale).not.toHaveBeenCalled();
  });
});

describe("createReactBareToolset › $.locale", () => {
  it("returns the current locale from context", async () => {
    const getCtx = mountCtx(await make().toolset, { locale: "en" });
    expect(getCtx().locale).toBe("en");
  });

  // Intentional pattern: try/catch + expect.unreachable — do not simplify.
  it("throws ERR_CONTEXT_NOT_FOUND when read outside ReactRMachine", async () => {
    const { Plug } = await make().toolset;
    function Orphan() {
      (Plug as AnyPlug)().useR();
      return null;
    }
    try {
      render(<Orphan />);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineError);
      expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
    }
  });
});

describe("createReactBareToolset › $.setLocale", () => {
  it("is a no-op when the new locale equals the current locale", async () => {
    const writeLocale = vi.fn();
    const getCtx = mountCtx(await make().toolset, { locale: "en", writeLocale });
    await act(async () => {
      await getCtx().setLocale("en");
    });
    expect(writeLocale).not.toHaveBeenCalled();
  });

  it("calls writeLocale with the new locale (sync and async)", async () => {
    const syncWrite = vi.fn();
    const getSync = mountCtx(await make().toolset, { writeLocale: syncWrite });
    await act(async () => {
      await getSync().setLocale("it");
    });
    expect(syncWrite).toHaveBeenCalledWith("it");

    cleanup();
    const asyncWrite = vi.fn(async () => {});
    const getAsync = mountCtx(await make().toolset, { writeLocale: asyncWrite });
    await act(async () => {
      await getAsync().setLocale("it");
    });
    expect(asyncWrite).toHaveBeenCalledWith("it");
  });

  // Intentional pattern: try/catch + expect.unreachable — do not simplify.
  it("validates the locale before checking writeLocale, throwing the raw validation error", async () => {
    // No writeLocale, but an invalid locale must surface the validation error
    // (not ERR_MISSING_WRITE_LOCALE).
    const getCtx = mountCtx(await make().toolset);
    try {
      await getCtx().setLocale("xx");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as RMachineError).message).toContain("xx");
      expect(error).not.toHaveProperty("code", ERR_MISSING_WRITE_LOCALE);
    }
  });

  it("throws ERR_MISSING_WRITE_LOCALE for a valid locale when no writeLocale is provided", async () => {
    const getCtx = mountCtx(await make().toolset);
    await expect(getCtx().setLocale("it")).rejects.toHaveProperty("code", ERR_MISSING_WRITE_LOCALE);
  });

  it("throws ERR_MISSING_WRITE_LOCALE after the writeLocale prop is removed", async () => {
    const { ReactRMachine, Plug } = await make().toolset;
    let ctx: Ctx | undefined;
    function Probe() {
      const { $ } = (Plug as () => { useR: () => { $: Ctx } })().useR();
      ctx = $;
      return null;
    }
    const writeLocale = vi.fn();
    const { rerender } = render(
      <ReactRMachine locale="en" writeLocale={writeLocale}>
        <Probe />
      </ReactRMachine>
    );
    await act(async () => {
      await ctx?.setLocale("it");
    });
    expect(writeLocale).toHaveBeenCalledWith("it");

    rerender(
      <ReactRMachine locale="en">
        <Probe />
      </ReactRMachine>
    );
    await expect(ctx?.setLocale("it")).rejects.toHaveProperty("code", ERR_MISSING_WRITE_LOCALE);
  });

  it("propagates a synchronous error thrown by writeLocale", async () => {
    const boom = new Error("write failed");
    const getCtx = mountCtx(await make().toolset, {
      writeLocale: () => {
        throw boom;
      },
    });
    await expect(getCtx().setLocale("it")).rejects.toBe(boom);
  });

  it("propagates a rejected promise from writeLocale", async () => {
    const boom = new Error("async write failed");
    const getCtx = mountCtx(await make().toolset, { writeLocale: () => Promise.reject(boom) });
    await expect(getCtx().setLocale("it")).rejects.toBe(boom);
  });
});

describe("createReactBareToolset › resource resolution via Plug", () => {
  function mountResource<T>(t: BareToolset, ns: string, locale = "en"): () => T {
    let res: T | undefined;
    function Probe() {
      const [r] = (t.Plug as unknown as (...a: unknown[]) => { useR: () => [T] })(ns).useR();
      res = r;
      return null;
    }
    render(
      <t.ReactRMachine locale={locale}>
        <Probe />
      </t.ReactRMachine>
    );
    return () => res as T;
  }

  // Intentional pattern: try/catch + expect.unreachable — do not simplify.
  it("throws ERR_CONTEXT_NOT_FOUND when used outside ReactRMachine", async () => {
    const { Plug } = await make().toolset;
    function Orphan() {
      (Plug as AnyPlug)("common").useR();
      return null;
    }
    try {
      render(<Orphan />);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
    }
  });

  it("resolves the resource for a namespace (cached → synchronous)", async () => {
    const get = mountResource<{ greeting: string }>(
      await make({ resolve: () => ({ greeting: "hello" }) }).toolset,
      "common"
    );
    expect(get().greeting).toBe("hello");
  });

  it("calls getWire with the kit, the namespace deps, and the current locale", async () => {
    const { mock, toolset } = make();
    mountResource(await toolset, "common");
    expect(spies(mock).getWire).toHaveBeenCalledWith({}, ["common"], "en", expect.any(Function), undefined);
  });

  it("re-resolves with the updated locale after a re-render", async () => {
    const { mock, toolset } = make();
    const t = await toolset;
    function Consumer() {
      (t.Plug as AnyPlug)("common").useR();
      return null;
    }
    const { rerender } = render(
      <t.ReactRMachine locale="en">
        <Consumer />
      </t.ReactRMachine>
    );
    rerender(
      <t.ReactRMachine locale="it">
        <Consumer />
      </t.ReactRMachine>
    );
    expect(spies(mock).getWire).toHaveBeenCalledWith({}, ["common"], "it", expect.any(Function), undefined);
  });

  it("passes a different namespace through to getWire", async () => {
    const { mock, toolset } = make({ resolve: (ns) => (ns === "nav" ? { home: "Home" } : { greeting: "hello" }) });
    const get = mountResource<{ home: string }>(await toolset, "nav");
    expect(get().home).toBe("Home");
    expect(spies(mock).getWire).toHaveBeenCalledWith({}, ["nav"], "en", expect.any(Function), undefined);
  });

  it("suspends while the wire is pending, then resolves when it settles", async () => {
    const fake = createFakeWire([{ greeting: "hello" }, {}], { pending: true });
    const t = await make({ getWire: () => fake.wire }).toolset;

    function Consumer() {
      const [common] = (t.Plug as unknown as (...a: unknown[]) => { useR: () => [{ greeting: string }] })(
        "common"
      ).useR();
      return <span data-testid="resource">{common.greeting}</span>;
    }

    await act(async () => {
      render(
        <t.ReactRMachine locale="en">
          <React.Suspense fallback={<span data-testid="fallback">loading</span>}>
            <Consumer />
          </React.Suspense>
        </t.ReactRMachine>
      );
    });
    screen.getByTestId("fallback");

    await act(async () => {
      fake.setPlugin([{ greeting: "hello" }, {}]);
    });
    expect((await screen.findByTestId("resource")).textContent).toBe("hello");
  });

  it("propagates a synchronous error thrown during wire resolution", async () => {
    const t = await make({
      getWire: () => {
        throw new Error("getWire exploded");
      },
    }).toolset;
    function Orphan() {
      (t.Plug as AnyPlug)("common").useR();
      return null;
    }
    expect(() =>
      render(
        <t.ReactRMachine locale="en">
          <Orphan />
        </t.ReactRMachine>
      )
    ).toThrow("getWire exploded");
  });
});

describe("createReactBareToolset › multiple deps via Plug (list form)", () => {
  it("resolves several namespaces as a positional tuple and forwards the list to getWire", async () => {
    const { mock, toolset } = make({
      resolve: (ns) => (ns === "nav" ? { home: "Home" } : { greeting: "hello" }),
    });
    const t = await toolset;
    let common: { greeting: string } | undefined;
    let nav: { home: string } | undefined;
    function Probe() {
      const [c, n] = (
        t.Plug as unknown as (...a: unknown[]) => { useR: () => [{ greeting: string }, { home: string }] }
      )("common", "nav").useR();
      common = c;
      nav = n;
      return null;
    }
    render(
      <t.ReactRMachine locale="en">
        <Probe />
      </t.ReactRMachine>
    );
    expect(common?.greeting).toBe("hello");
    expect(nav?.home).toBe("Home");
    expect(spies(mock).getWire).toHaveBeenCalledWith({}, ["common", "nav"], "en", expect.any(Function), undefined);
  });
});
