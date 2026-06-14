/**
 * Regression: a FRAMELESS (uncovered) VertexGear consumer must NOT hang in an
 * infinite Suspense loop, and sibling frameless consumers must get INDEPENDENT
 * per-instance state. See [[project-open-bug-frameless-vertex-csr-suspense-loop]].
 *
 * Root cause it guards: an uncovered vertex consumer needs per-consumer identity,
 * but React resets `useRef`/`useId` on every pre-commit Suspense retry — so the
 * old per-consumer key churned a new wire (new pending promise) every retry and
 * `use()` re-suspended forever. The fix shares a module-stable default key
 * pre-commit (all reach commit on one resolved promise), then splits per-consumer
 * post-commit (owner keeps the wire; others move to a fresh count-0 wire).
 *
 * NOTE: if the loop regressed, these tests would HANG (act never settles) and
 * time out — committing at all is itself the no-loop proof. The render-count
 * bounds catch a "commits but re-renders excessively" regression.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  BlueprintManager,
  type BusHost,
  createCassetteRecorder,
  createOuterGearComposer,
  type ResComposerConnector,
  ResLayoutResolver,
  ResManager,
  WireManager,
} from "r-machine/core";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createReactBareToolset } from "../../src/core/react-bare-toolset.js";

afterEach(cleanup);

// Real RM/WM/BM stack with a single stateful vertex counter at `v/counter`.
// Mirrors `buildRealEnv` in commit-tracking.test.tsx but pins the vertex layout.
function buildVertexEnv() {
  const recorder = createCassetteRecorder();
  const resolver = new ResLayoutResolver({ "v/": "gear:outer(vertex)" });
  const busHost: BusHost = { bus: undefined };

  let rm!: ResManager;
  const connector: ResComposerConnector = {
    getWire: async (nsDeps, locale, augmentCtx, chain) => {
      const plugin = await rm.getPlugin({}, nsDeps, locale, augmentCtx, chain, 0, undefined);
      return { plugin };
    },
  };

  const composer = createOuterGearComposer<any, any>(connector, recorder);
  const counterMatrix = composer.withState({ count: 0 }).define((plugin: any, cursor: any) => ({
    count: cursor.getter(() => plugin.$.state.count),
    inc: cursor.action(() => ({ count: plugin.$.state.count + 1 })),
  }));

  const modules: Record<string, { r: unknown }> = { "v/counter": { r: counterMatrix as unknown } };
  const loader = async (_p: string, opts: any) => modules[opts.namespace as string];
  const equipment = { gearKit: { counter: "v/counter" }, shellKit: {}, bridgeGears: [] };
  const bm = new BlueprintManager(resolver, loader as never, { gear: ["v/counter" as never], shell: [] }, [], busHost);
  rm = new ResManager(resolver, equipment as never, bm, busHost);
  const wm = new WireManager(rm, busHost, recorder);

  const fakeMachine = {
    localeHelper: { validateLocale: () => null, defaultLocale: "en" },
    getWire: wm.getWire.bind(wm),
    resolveLayoutEntryType: (ns: string) => resolver.resolveLayoutEntryType(ns as never),
  };
  return { fakeMachine, rm, wm };
}

type Counter = { count: number; inc: () => unknown };

describe("frameless VertexGear consumer — no Suspense loop, independent instances", () => {
  it("a single frameless consumer commits (no loop) at count 0", async () => {
    const { fakeMachine } = buildVertexEnv();
    const { ReactRMachine, Plug } = await createReactBareToolset(fakeMachine as never, {} as never);
    const CounterPlug = (Plug as any)("v/counter");

    let renders = 0;
    function Widget() {
      renders++;
      const [c] = (CounterPlug as any).useR() as [Counter];
      return <span data-testid="single">{c.count}</span>;
    }

    await act(async () => {
      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={<div>loading</div>}>
            <Widget />
          </React.Suspense>
        </ReactRMachine>
      );
    });

    expect((await screen.findByTestId("single")).textContent).toBe("0");
    // Single instance is its own owner → no "move", so re-renders stay tiny.
    expect(renders).toBeLessThan(12);
  });

  it("two frameless siblings get INDEPENDENT instances", async () => {
    const { fakeMachine } = buildVertexEnv();
    const { ReactRMachine, Plug } = await createReactBareToolset(fakeMachine as never, {} as never);
    const CounterPlug = (Plug as any)("v/counter");

    let totalRenders = 0;
    function Widget({ label }: { label: string }) {
      totalRenders++;
      const [c] = (CounterPlug as any).useR() as [Counter];
      return (
        <button type="button" data-testid={label} onClick={() => c.inc()}>
          {c.count}
        </button>
      );
    }

    await act(async () => {
      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={<div>loading</div>}>
            <Widget label="A" />
            <Widget label="B" />
          </React.Suspense>
        </ReactRMachine>
      );
    });

    const a = await screen.findByTestId("A");
    const b = await screen.findByTestId("B");
    expect(a.textContent).toBe("0");
    expect(b.textContent).toBe("0");

    await act(async () => {
      fireEvent.click(a);
    });
    // A advances; B must NOT (independent instances, not a shared slot).
    expect(a.textContent).toBe("1");
    expect(b.textContent).toBe("0");

    await act(async () => {
      fireEvent.click(b);
    });
    expect(a.textContent).toBe("1");
    expect(b.textContent).toBe("1");

    expect(totalRenders).toBeLessThan(40);
  });

  it("a frameless consumer that mounts LATE shows its own count 0, not the owner's value", async () => {
    const { fakeMachine } = buildVertexEnv();
    const { ReactRMachine, Plug } = await createReactBareToolset(fakeMachine as never, {} as never);
    const CounterPlug = (Plug as any)("v/counter");

    let showLate: ((v: boolean) => void) | null = null;
    function Widget({ label }: { label: string }) {
      const [c] = (CounterPlug as any).useR() as [Counter];
      return (
        <button type="button" data-testid={label} onClick={() => c.inc()}>
          {c.count}
        </button>
      );
    }
    function Harness() {
      const [late, setLate] = React.useState(false);
      showLate = setLate;
      return (
        <React.Suspense fallback={<div>loading</div>}>
          <Widget label="A" />
          {late ? <Widget label="C" /> : null}
        </React.Suspense>
      );
    }

    await act(async () => {
      render(
        <ReactRMachine locale="en">
          <Harness />
        </ReactRMachine>
      );
    });

    const a = await screen.findByTestId("A");
    // Drive A up to 5 BEFORE C mounts.
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        fireEvent.click(a);
      });
    }
    expect(a.textContent).toBe("5");

    // Mount C late: it must show its OWN fresh instance (0), never flash 5.
    await act(async () => {
      showLate?.(true);
    });
    const c = await screen.findByTestId("C");
    expect(c.textContent).toBe("0");
    expect(a.textContent).toBe("5");

    // And C is independent of A.
    await act(async () => {
      fireEvent.click(c);
    });
    expect(c.textContent).toBe("1");
    expect(a.textContent).toBe("5");
  });

  it("covered consumers under a VertexFrame still SHARE one instance (unchanged)", async () => {
    const { fakeMachine } = buildVertexEnv();
    const toolset = await createReactBareToolset(fakeMachine as never, {} as never);
    const { ReactRMachine, Plug } = toolset;
    const VertexFrame = (toolset as any).VertexFrame;
    const CounterPlug = (Plug as any)("v/counter");

    function Widget({ label }: { label: string }) {
      const [c] = (CounterPlug as any).useR() as [Counter];
      return (
        <button type="button" data-testid={label} onClick={() => c.inc()}>
          {c.count}
        </button>
      );
    }
    function App() {
      // Parent owns the vertex instance and lends it to the frame; C and D
      // (same plug) resolve THROUGH the frame → one shared instance.
      const [frameCounter] = (CounterPlug as any).useR() as [Counter];
      return (
        <VertexFrame gear={[frameCounter as never]}>
          <Widget label="C" />
          <Widget label="D" />
        </VertexFrame>
      );
    }

    await act(async () => {
      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={<div>loading</div>}>
            <App />
          </React.Suspense>
        </ReactRMachine>
      );
    });

    const c = await screen.findByTestId("C");
    const d = await screen.findByTestId("D");
    expect(c.textContent).toBe("0");
    expect(d.textContent).toBe("0");

    await act(async () => {
      fireEvent.click(c);
    });
    // Shared instance: incrementing C moves D too.
    expect(c.textContent).toBe("1");
    expect(d.textContent).toBe("1");
  });

  it("covered consumers survive an HMR invalidate of the vertex without crashing", async () => {
    // Regression: editing the vertex gear file triggers `invalidate`, which
    // disposes the creator slot and notifies all subscribers SYNCHRONOUSLY. A
    // covered consumer's snapshot read can run before the creator re-commits, so
    // its covered lookup found a missing parent slot and the async path THREW
    // ERR_VERTEX_INSTANCE_NOT_FOUND (unhandled rejection + render crash). The fix
    // makes the covered miss SUSPEND (COVERED_PENDING) and retry once the creator
    // re-resolves. See [[wire-manager.resolve]].
    const { fakeMachine, rm } = buildVertexEnv();
    const toolset = await createReactBareToolset(fakeMachine as never, {} as never);
    const { ReactRMachine, Plug } = toolset;
    const VertexFrame = (toolset as any).VertexFrame;
    const CounterPlug = (Plug as any)("v/counter");

    const caught: unknown[] = [];
    class Boundary extends React.Component<{ children: React.ReactNode }, { error: unknown }> {
      override state = { error: null as unknown };
      static getDerivedStateFromError(error: unknown) {
        return { error };
      }
      override componentDidCatch(error: unknown) {
        caught.push(error);
      }
      override render() {
        return this.state.error ? <div data-testid="boundary">crashed</div> : this.props.children;
      }
    }

    const rejections: unknown[] = [];
    const onRejection = (e: PromiseRejectionEvent) => rejections.push(e.reason);
    window.addEventListener("unhandledrejection", onRejection);

    function Widget({ label }: { label: string }) {
      const [c] = (CounterPlug as any).useR() as [Counter];
      return (
        <button type="button" data-testid={label} onClick={() => c.inc()}>
          {c.count}
        </button>
      );
    }
    function App() {
      const [frameCounter] = (CounterPlug as any).useR() as [Counter];
      return (
        <VertexFrame gear={[frameCounter as never]}>
          <Widget label="C" />
          <Widget label="D" />
        </VertexFrame>
      );
    }

    try {
      await act(async () => {
        render(
          <ReactRMachine locale="en">
            <Boundary>
              <React.Suspense fallback={<div>loading</div>}>
                <App />
              </React.Suspense>
            </Boundary>
          </ReactRMachine>
        );
      });

      const c = await screen.findByTestId("C");
      const d = await screen.findByTestId("D");
      await act(async () => {
        fireEvent.click(c);
      });
      expect(c.textContent).toBe("1");
      expect(d.textContent).toBe("1");

      // HMR: invalidate the vertex (disposes the creator slot, notifies subscribers).
      await act(async () => {
        rm.invalidate("v/counter" as never);
      });
      // Let any deferred microtask teardown / unhandled rejections flush.
      await act(async () => {
        await Promise.resolve();
      });

      // No crash: the boundary never tripped and nothing rejected unhandled.
      expect(caught).toEqual([]);
      expect(screen.queryByTestId("boundary")).toBeNull();
      expect(rejections).toEqual([]);

      // Recovered to a FRESH shared instance (invalidate rebuilt it at count 0).
      const c2 = await screen.findByTestId("C");
      const d2 = await screen.findByTestId("D");
      expect(c2.textContent).toBe("0");
      expect(d2.textContent).toBe("0");

      // Still a live, shared instance after recovery.
      await act(async () => {
        fireEvent.click(c2);
      });
      expect(c2.textContent).toBe("1");
      expect(d2.textContent).toBe("1");
    } finally {
      window.removeEventListener("unhandledrejection", onRejection);
    }
  });

  it("two frameless siblings stay independent under React.StrictMode", async () => {
    const { fakeMachine } = buildVertexEnv();
    const { ReactRMachine, Plug } = await createReactBareToolset(fakeMachine as never, {} as never);
    const CounterPlug = (Plug as any)("v/counter");

    function Widget({ label }: { label: string }) {
      const [c] = (CounterPlug as any).useR() as [Counter];
      return (
        <button type="button" data-testid={label} onClick={() => c.inc()}>
          {c.count}
        </button>
      );
    }

    await act(async () => {
      render(
        <React.StrictMode>
          <ReactRMachine locale="en">
            <React.Suspense fallback={<div>loading</div>}>
              <Widget label="A" />
              <Widget label="B" />
            </React.Suspense>
          </ReactRMachine>
        </React.StrictMode>
      );
    });

    const a = await screen.findByTestId("A");
    const b = await screen.findByTestId("B");
    expect(a.textContent).toBe("0");
    expect(b.textContent).toBe("0");

    await act(async () => {
      fireEvent.click(a);
    });
    expect(a.textContent).toBe("1");
    expect(b.textContent).toBe("0");
  });
});
