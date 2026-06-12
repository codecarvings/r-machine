/**
 * End-to-end Tier A: when a resource's ResManager slot is already warm, a
 * freshly-mounted consumer's wire resolves SYNCHRONOUSLY — `getPluginPromise()`
 * hands React `use()` a fulfilled-tagged thenable, so the consumer commits on
 * its first render and the Suspense fallback NEVER appears.
 *
 * Contrast: the same consumer mounted against a COLD slot suspends (the
 * fallback renders) until the async resolve settles. See the sync-resolve fast
 * path in core (`ResManager.getPluginSync` + `wire-manager.resolve`).
 */
import { cleanup, render, screen } from "@testing-library/react";
import {
  BlueprintManager,
  type BusHost,
  createCassetteRecorder,
  createOuterGearComposer,
  type PluginCtxAugmenter,
  type ResComposerConnector,
  ResLayoutResolver,
  ResManager,
  WireManager,
} from "r-machine/core";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createReactBareToolset } from "../../src/core/react-bare-toolset.js";

afterEach(cleanup);

// Real BM + RM + WM stack with a single stateless-ish counter OuterGear at
// `v/counter` (non-vertex outer layout → process-tier slot, no request scope in
// a plain render). Exposes `rm` so a test can pre-warm the slot directly.
function buildEnv() {
  const recorder = createCassetteRecorder();
  const resolver = new ResLayoutResolver({ "v/": "gear:outer" });
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
  return { fakeMachine, rm };
}

const noopAugment: PluginCtxAugmenter = ($) => $;

describe("Tier A end-to-end — warm slot resolves without a Suspense fallback", () => {
  it("commits synchronously (fallback never renders) when the slot is pre-warmed", async () => {
    const { fakeMachine, rm } = buildEnv();
    const { ReactRMachine, Plug } = await createReactBareToolset(fakeMachine as never, {} as never);

    // Pre-warm the process-tier slot for v/counter (runs the OG factory once).
    await rm.getPlugin({}, ["v/counter"], "en", noopAugment, [], 1, undefined);

    const CounterPlug = (Plug as any)("v/counter");
    function Counter() {
      const [counter] = (CounterPlug as any).useR() as [{ count: number }];
      return <span data-testid="content">count: {counter.count}</span>;
    }

    // Synchronous render: a fulfilled-tagged thenable lets `use()` commit during
    // the first render, so the content is present immediately and the fallback
    // never mounts.
    render(
      <ReactRMachine locale="en">
        <React.Suspense fallback={<span data-testid="fallback">loading</span>}>
          <Counter />
        </React.Suspense>
      </ReactRMachine>
    );

    expect(screen.queryByTestId("fallback")).toBeNull();
    expect(screen.getByTestId("content").textContent).toBe("count: 0");
  });

  // The COLD contrast (a consumer mounted against an unresolved slot renders the
  // Suspense fallback until the async resolve settles) is covered by
  // "suspends while the wire is pending, then resolves when it settles" in
  // tests/core/react-bare-toolset.test.tsx. The warm case above is the new
  // behavior this fast path introduces.
});
