import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  BlueprintManager,
  type BusHost,
  createCassetteRecorder,
  createOuterGearComposer,
  type GateWire,
  GateWireManager,
  JunctureManager,
  type ResComposerConnector,
  ResLayoutResolver,
} from "r-machine/core";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createReactBareToolset } from "../../src/core/react-bare-toolset.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// A fake GateWire used to verify that `useBareReactPlug` calls the wire's
// commit-tracking API correctly. We don't need a real recorder/cell here —
// just spies on the API surface.
// ---------------------------------------------------------------------------

function createFakeWire(): {
  wire: GateWire;
  startTrackingSpy: ReturnType<typeof vi.fn>;
  commitSpy: ReturnType<typeof vi.fn>;
  notify: () => void;
  unsubscribeSpy: ReturnType<typeof vi.fn>;
  pluginValue: { greeting: string };
} {
  const subscribers = new Set<() => void>();
  const pluginValue = { greeting: "hello" };
  let currentPromise = Promise.resolve(pluginValue);

  const commitSpy = vi.fn();
  const startTrackingSpy = vi.fn(() => commitSpy);
  const unsubscribeSpy = vi.fn();

  const wire: GateWire = {
    getPluginPromise: () => currentPromise,
    subscribe: (cb: () => void) => {
      subscribers.add(cb);
      return () => {
        unsubscribeSpy();
        subscribers.delete(cb);
      };
    },
    startTracking: startTrackingSpy as never,
    updateRequest: vi.fn(),
  };

  return {
    wire,
    startTrackingSpy,
    commitSpy,
    notify: () => {
      // Mirror real wire behavior: bust the promise identity then fire subs.
      currentPromise = currentPromise.then((p) => p);
      for (const cb of subscribers) cb();
    },
    unsubscribeSpy,
    pluginValue,
  };
}

// Builds a mock machine whose `getGateWire` returns a controllable fake wire.
// The mock-machine fixture only covers the hybridPickR path; the gate-wire
// path is exercised here.
function createMockMachineWithWire(wire: GateWire) {
  const mock = createMockMachine() as unknown as Record<string, unknown>;
  mock.getGateWire = vi.fn(() => wire);
  return mock as Parameters<typeof createReactBareToolset>[0];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useBareReactPlug — commit-tracking integration", () => {
  it("calls wire.startTracking during render and the returned commit fn after commit", async () => {
    const { wire, startTrackingSpy, commitSpy } = createFakeWire();
    const mock = createMockMachineWithWire(wire);
    const { ReactRMachine, Plug } = await createReactBareToolset(mock as never, {} as never);

    const TestPlug = (Plug as never as (...a: unknown[]) => { useR: () => unknown })();
    function Consumer() {
      (TestPlug as { useR: () => unknown }).useR();
      return null;
    }

    await act(async () => {
      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={null}>
            <Consumer />
          </React.Suspense>
        </ReactRMachine>
      );
    });

    // startTracking is called on every render attempt that gets past the hook.
    expect(startTrackingSpy).toHaveBeenCalled();
    // Commit fn fires post-render (inside useEffect).
    expect(commitSpy).toHaveBeenCalled();
  });

  it("re-renders when the wire's subscribe callback fires", async () => {
    const fake = createFakeWire();
    const mock = createMockMachineWithWire(fake.wire);
    const { ReactRMachine, Plug } = await createReactBareToolset(mock as never, {} as never);
    const TestPlug = (Plug as never as (...a: unknown[]) => { useR: () => unknown })();

    let renderCount = 0;
    function Consumer() {
      (TestPlug as { useR: () => unknown }).useR();
      renderCount++;
      return <div data-testid="renders">{renderCount}</div>;
    }

    await act(async () => {
      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={null}>
            <Consumer />
          </React.Suspense>
        </ReactRMachine>
      );
    });

    const renderBeforeNotify = renderCount;

    await act(async () => {
      fake.notify();
    });

    expect(renderCount).toBeGreaterThan(renderBeforeNotify);
  });

  it("unsubscribes from the wire when the consumer unmounts", async () => {
    const fake = createFakeWire();
    const mock = createMockMachineWithWire(fake.wire);
    const { ReactRMachine, Plug } = await createReactBareToolset(mock as never, {} as never);
    const TestPlug = (Plug as never as (...a: unknown[]) => { useR: () => unknown })();

    function Consumer() {
      (TestPlug as { useR: () => unknown }).useR();
      return null;
    }

    let result!: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={null}>
            <Consumer />
          </React.Suspense>
        </ReactRMachine>
      );
    });

    // Unmount completely — fires useSyncExternalStore cleanup → the wire's
    // subscribe-returned unsubscribe.
    await act(async () => {
      result.unmount();
    });

    expect(fake.unsubscribeSpy).toHaveBeenCalled();
  });

  it("calls startTracking again on each re-render (insert is idempotent)", async () => {
    const fake = createFakeWire();
    const mock = createMockMachineWithWire(fake.wire);
    const { ReactRMachine, Plug } = await createReactBareToolset(mock as never, {} as never);
    const TestPlug = (Plug as never as (...a: unknown[]) => { useR: () => unknown })();

    function Consumer() {
      (TestPlug as { useR: () => unknown }).useR();
      return null;
    }

    await act(async () => {
      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={null}>
            <Consumer />
          </React.Suspense>
        </ReactRMachine>
      );
    });

    const initialStartCalls = fake.startTrackingSpy.mock.calls.length;
    const initialCommitCalls = fake.commitSpy.mock.calls.length;

    // Trigger a re-render via notify.
    await act(async () => {
      fake.notify();
    });

    expect(fake.startTrackingSpy.mock.calls.length).toBeGreaterThan(initialStartCalls);
    expect(fake.commitSpy.mock.calls.length).toBeGreaterThan(initialCommitCalls);
  });
});

// ---------------------------------------------------------------------------
// End-to-end working example: a Counter component reading from a real
// OuterGear, with the full blueprint stack (BM + JM + GWM + real composer).
// ---------------------------------------------------------------------------

function buildRealEnv() {
  const recorder = createCassetteRecorder();
  const resolver = new ResLayoutResolver({ "v/": "gear:outer" });
  const busHost: BusHost = { bus: undefined };

  let jm!: JunctureManager;

  const connector: ResComposerConnector = {
    getWire: async (nsDeps, locale, augmentCtx, chain) => {
      const plugin = await jm.getPlugin({}, nsDeps, locale, augmentCtx, chain, 0, undefined);
      return { plugin };
    },
  };

  // Build the counter OG via the PUBLIC composer.
  const composer = createOuterGearComposer<any, any>(connector, recorder);
  const counterMatrix = composer.withState({ count: 0 }).define((plugin: any, cursor: any) => ({
    count: cursor.getter(() => plugin.$.state.count),
    inc: cursor.action(() => ({ count: plugin.$.state.count + 1 })),
  }));

  const modules: Record<string, { r: unknown }> = {
    "v/counter": { r: counterMatrix as unknown },
  };

  const loader = async (_p: string, opts: any) => modules[opts.namespace as string];
  const equipment = { gearKit: { counter: "v/counter" }, shellKit: {}, bridgeGears: [] };
  const bm = new BlueprintManager(resolver, loader as never, { gear: ["v/counter" as never], shell: [] }, [], busHost);
  jm = new JunctureManager(resolver, equipment as never, bm, busHost);
  const gwm = new GateWireManager(jm, busHost, recorder);

  // Fake machine surface: just what createReactBareToolset and useBareReactPlug
  // actually touch — validateLocale + defaultLocale + getGateWire.
  const fakeMachine = {
    localeHelper: {
      validateLocale: () => null,
      defaultLocale: "en",
    },
    getGateWire: gwm.getWire.bind(gwm),
  };

  return { fakeMachine };
}

describe("Counter — end-to-end via real RMachine + OuterGear stateful + Plug.useR()", () => {
  it("renders state via OG getter and re-renders after action mutates", async () => {
    const { fakeMachine } = buildRealEnv();

    const { ReactRMachine, Plug } = await createReactBareToolset(fakeMachine as never, {} as never);

    // List-mode plug: single string handle → useR() returns [...resources, $].
    const CounterPlug = (Plug as any)("v/counter");

    function Counter() {
      const [counter] = (CounterPlug as any).useR() as [{ count: number; inc: () => unknown }];
      return (
        <button type="button" onClick={() => counter.inc()}>
          count: {counter.count}
        </button>
      );
    }

    await act(async () => {
      render(
        <ReactRMachine locale="en">
          <React.Suspense fallback={<div>loading</div>}>
            <Counter />
          </React.Suspense>
        </ReactRMachine>
      );
    });

    const button = await screen.findByRole("button");
    expect(button.textContent).toBe("count: 0");

    await act(async () => {
      fireEvent.click(button);
    });
    expect(button.textContent).toBe("count: 1");

    await act(async () => {
      fireEvent.click(button);
    });
    expect(button.textContent).toBe("count: 2");
  });
});
