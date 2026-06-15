/**
 * Regression: an uncovered (frameless) VertexGear consumer rendered under an
 * ACTIVE request scope (server SSR) must store its wire in the REQUEST SCOPE,
 * not in the module-level `perConsumerWireCaches`. The module-level cache is a
 * client-only share-then-split Suspense fix; on the server it is keyed by a
 * module-stable `getDefaultKey()` that is never claimed (SSR never commits), so
 * the wire would persist across requests — producing stale SSR output (dev HMR
 * hydration mismatch) and a cross-request state leak in production.
 *
 * The invariant asserted here: with a request scope present, the uncovered-vertex
 * wire is routed through `scope.wireCachesByPlugId` (disposed when the request
 * ends), exactly like a plain OuterGear consumer. Before the fix this map stayed
 * empty for uncovered-vertex consumers and the wire leaked module-level.
 *
 * Single consumer per render on purpose: in jsdom the share-then-split layout
 * effect runs (unlike real SSR), and with a scope present all siblings share one
 * scope-cached wire — a combination that never co-occurs in production. A single
 * consumer claims ownership and never "moves", keeping the test loop-free.
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import {
  BlueprintManager,
  type BusHost,
  createCassetteRecorder,
  createOuterGearComposer,
  createRequestScope,
  PROCESS_SCOPE_PROVIDER,
  type ResComposerConnector,
  ResLayoutResolver,
  ResManager,
  WireManager,
} from "r-machine/core";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createReactBareToolset } from "../../src/core/react-bare-toolset.js";
import { RequestScopeContext } from "../../src/core/scope-context.js";

afterEach(cleanup);

// Real RM/WM/BM stack with a single stateful vertex counter at `v/counter`.
// Mirrors `buildVertexEnv` in frameless-vertex-suspense.test.tsx, plus a
// `requestScope` stub on the fake machine: `useBareReactPlug`'s resolution
// wrapper calls `rMachine.requestScope.getProvider().setOverride?.()` when a
// scope is present, so the machine must expose it (setOverride is absent on the
// process provider → optional-chained no-op).
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
    // Present so the resolution wrapper's setOverride call doesn't throw.
    requestScope: { getProvider: () => PROCESS_SCOPE_PROVIDER },
  };
  return { fakeMachine };
}

type Counter = { count: number; inc: () => unknown };

describe("uncovered VertexGear consumer is request-scoped under an active request scope", () => {
  it("routes its wire through scope.wireCachesByPlugId (not the module-level per-consumer cache)", async () => {
    const { fakeMachine } = buildVertexEnv();
    const { ReactRMachine, Plug } = await createReactBareToolset(fakeMachine as never, {} as never);
    const CounterPlug = (Plug as any)("v/counter");

    function Widget() {
      const [c] = (CounterPlug as any).useR() as [Counter];
      return <span data-testid="v">{c.count}</span>;
    }

    const scope = createRequestScope();
    await act(async () => {
      render(
        <RequestScopeContext.Provider value={scope}>
          <ReactRMachine locale="en">
            <React.Suspense fallback={<div>loading</div>}>
              <Widget />
            </React.Suspense>
          </ReactRMachine>
        </RequestScopeContext.Provider>
      );
    });

    expect((await screen.findByTestId("v")).textContent).toBe("0");
    // The fix: with a request scope active, the uncovered-vertex wire lives in
    // the scope (request-scoped lifetime), NOT the module-level cache.
    expect(scope.wireCachesByPlugId.size).toBeGreaterThan(0);
  });

  it("a fresh request scope gets its own wire (no cross-request persistence)", async () => {
    const { fakeMachine } = buildVertexEnv();
    const { ReactRMachine, Plug } = await createReactBareToolset(fakeMachine as never, {} as never);
    const CounterPlug = (Plug as any)("v/counter");

    function Widget() {
      const [c] = (CounterPlug as any).useR() as [Counter];
      return <span data-testid="v">{c.count}</span>;
    }
    const renderUnder = async (scope: ReturnType<typeof createRequestScope>) => {
      await act(async () => {
        render(
          <RequestScopeContext.Provider value={scope}>
            <ReactRMachine locale="en">
              <React.Suspense fallback={<div>loading</div>}>
                <Widget />
              </React.Suspense>
            </ReactRMachine>
          </RequestScopeContext.Provider>
        );
      });
      await screen.findByTestId("v");
    };

    const scopeA = createRequestScope();
    await renderUnder(scopeA);
    expect(scopeA.wireCachesByPlugId.size).toBeGreaterThan(0);
    cleanup();

    // Second request → fresh scope → its own wire cache, independent of A.
    const scopeB = createRequestScope();
    await renderUnder(scopeB);
    expect(scopeB.wireCachesByPlugId.size).toBeGreaterThan(0);
  });
});
