import { describe, expect, it, vi } from "vitest";
import { BlueprintManager } from "../../src/core/blueprint-manager.js";
import type { BusHost } from "../../src/core/event-bus.js";
import { GateWireManager } from "../../src/core/gate-wire-manager.js";
import { getCurrentSurface, type Juncture } from "../../src/core/juncture.js";
import { JunctureManager } from "../../src/core/juncture-manager.js";
import { createOuterGearComposer } from "../../src/core/outer-gear-composer.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResEquipment } from "../../src/core/res-equipment.js";
import { type AnyResLayout, ResLayoutResolver } from "../../src/core/res-layout.js";
import type { AnyResModule, ResModuleLoaderFnOptions } from "../../src/core/res-module.js";

// --- helpers -----------------------------------------------------------------

const LAYOUT: AnyResLayout = { "g/": "gear:outer" };

// Build BM + JM + GWM with the public OuterGear composer. Mirrors juncture-manager.test.ts's
// createJmTestEnv, but registers a real ResMatrix produced by `createOuterGearComposer`
// rather than a hand-stitched fake matrix. This validates the full path:
// composer → matrix → JM resolve → augmentCtx → cursor → state cell + getter + action.
function buildEnv(modules: Record<string, (jm: JunctureManager) => AnyResModule>) {
  let jm!: JunctureManager;

  const loader = async (_p: string, opts?: ResModuleLoaderFnOptions): Promise<AnyResModule> => {
    if (!opts) throw new Error("expected ResModuleLoaderFnOptions");
    const factory = modules[opts.namespace];
    if (!factory) throw new Error(`No module registered for "${opts.namespace}"`);
    return factory(jm);
  };

  const resolver = new ResLayoutResolver(LAYOUT);
  const gearNs = Object.keys(modules) as AnyNamespace[];
  const gearKit = Object.fromEntries(gearNs.map((ns) => [ns.replace(/[^a-z]/g, ""), ns]));
  const equipment: AnyResEquipment = { gearKit, shellKit: {}, bridgeGears: [] };
  const busHost: BusHost = { bus: undefined };
  const bm = new BlueprintManager(resolver, loader, { gear: gearNs, shell: [] }, [], busHost);
  jm = new JunctureManager(resolver, equipment, bm, busHost);
  const gwm = new GateWireManager(jm, busHost);

  const jmInternal = jm as unknown as {
    getJuncture(
      ns: AnyNamespace,
      locale: string | undefined,
      genId: number,
      vgm: undefined,
      chain: readonly AnyNamespace[]
    ): Promise<Juncture>;
  };

  return { jm, jmInternal, gwm };
}

async function resolveResource(jmInternal: { getJuncture: (...a: never[]) => Promise<Juncture> }, ns: AnyNamespace) {
  const juncture = await (jmInternal.getJuncture as (
    ns: AnyNamespace,
    locale: string | undefined,
    genId: number,
    vgm: undefined,
    chain: readonly AnyNamespace[]
  ) => Promise<Juncture>)(ns, undefined, 0, undefined, []);
  return getCurrentSurface(juncture);
}

// Builds a stateful OG matrix via the PUBLIC composer (no internal _-prefixed
// helpers). The connector closure dispatches back into jm at factory time.
// Plugin shape under the real JunctureManager: `{ ...kit, ...deps, $ }`. The
// augmented ctx (state/defaultState/ports/...) lives at `plugin.$`.
function makeStatefulOuterGearModule<S>(
  defaultState: S,
  factory: (plugin: { $: { state: S; defaultState: S } }, cursor: any) => unknown
) {
  return (jm: JunctureManager): AnyResModule => {
    const connector: ResComposerConnector = {
      getWire: async (nsDeps, locale, augmentCtx, chain) => {
        const plugin = await jm.getPlugin({}, nsDeps, locale, augmentCtx, chain, 0, undefined);
        return { plugin };
      },
    };
    const composer = createOuterGearComposer<any, any>(connector);
    const matrix = composer.withState(defaultState).define(factory as never);
    return { r: matrix as unknown as AnyRes };
  };
}

// --- tests -------------------------------------------------------------------

describe("OuterGear stateful — full blueprint stack", () => {
  it("public composer → JM resolve → resource exposes a working getter and action", async () => {
    const { jmInternal } = buildEnv({
      "g/counter": makeStatefulOuterGearModule({ count: 0 }, (plugin, cursor) => ({
        read: cursor.getter(() => plugin.$.state.count),
        add: cursor.action((n: number) => ({ count: plugin.$.state.count + n })),
      })),
    });

    const resource = (await resolveResource(jmInternal, "g/counter")) as {
      read: () => number;
      add: (n: number) => unknown;
    };

    expect(resource.read()).toBe(0);
    resource.add(5);
    expect(resource.read()).toBe(5);
    resource.add(3);
    expect(resource.read()).toBe(8);
  });

  it("memoized getter resolved via the blueprint stack short-circuits on equal output", async () => {
    const bodyCalls = vi.fn();
    const { jmInternal } = buildEnv({
      "g/cart": makeStatefulOuterGearModule(
        { items: [{ price: 10 }, { price: 20 }], other: 0 },
        (plugin, cursor) => ({
          subtotal: cursor.getter("memoized", () => {
            bodyCalls();
            return plugin.$.state.items.reduce((s: number, i: { price: number }) => s + i.price, 0);
          }),
          setItems: cursor.action((items: { price: number }[]) => ({ items })),
          setOther: cursor.action((n: number) => ({ other: n })),
        })
      ),
    });

    const resource = (await resolveResource(jmInternal, "g/cart")) as {
      subtotal: () => number;
      setItems: (items: { price: number }[]) => unknown;
      setOther: (n: number) => unknown;
    };

    expect(resource.subtotal()).toBe(30);
    expect(bodyCalls).toHaveBeenCalledTimes(1);

    // Hit: body must not run again.
    expect(resource.subtotal()).toBe(30);
    expect(bodyCalls).toHaveBeenCalledTimes(1);

    // Invalidation via an action that touches a different key (items unchanged):
    // memo body re-runs once on next read, but returns the same total → still 30.
    resource.setOther(99);
    expect(resource.subtotal()).toBe(30);
    expect(bodyCalls).toHaveBeenCalledTimes(2);

    // Now actually change items.
    resource.setItems([{ price: 5 }, { price: 5 }]);
    expect(resource.subtotal()).toBe(10);
    expect(bodyCalls).toHaveBeenCalledTimes(3);
  });

  it("commit-tracking via real GateWire: action on a tracked OG fires the wire's subscribers", async () => {
    const { jmInternal, gwm } = buildEnv({
      "g/counter": makeStatefulOuterGearModule({ count: 0 }, (plugin, cursor) => ({
        read: cursor.getter(() => plugin.$.state.count),
        add: cursor.action((n: number) => ({ count: plugin.$.state.count + n })),
      })),
    });

    const resource = (await resolveResource(jmInternal, "g/counter")) as {
      read: () => number;
      add: (n: number) => unknown;
    };

    // Pure consumer-side wire: no nsDeps, just used as a notification channel
    // for cassette-tracked reads.
    const wire = gwm.getWire({}, [], "en", ($) => $);
    const notify = vi.fn();
    wire.subscribe(notify);

    const commit = wire.startTracking();
    expect(resource.read()).toBe(0);
    commit();

    // No mutation yet → no notification.
    expect(notify).not.toHaveBeenCalled();

    // Mutate via the action: the cassette-tracked StateCell publishes, the
    // wire's notifyFromCassette path fires subscribers.
    resource.add(5);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(resource.read()).toBe(5);

    // A second action on the same dep fires the subscriber again (subscription
    // is persistent until next commit or wire teardown).
    resource.add(3);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(resource.read()).toBe(8);
  });

  it("memoized getter equality short-circuit propagates through the real GateWire: no notify when output unchanged", async () => {
    const { jmInternal, gwm } = buildEnv({
      "g/cart": makeStatefulOuterGearModule(
        { items: [{ price: 10 }, { price: 20 }], other: 0 },
        (plugin, cursor) => ({
          subtotal: cursor.getter("memoized", () =>
            plugin.$.state.items.reduce((s: number, i: { price: number }) => s + i.price, 0)
          ),
          setOther: cursor.action((n: number) => ({ other: n })),
          setItems: cursor.action((items: { price: number }[]) => ({ items })),
        })
      ),
    });

    const resource = (await resolveResource(jmInternal, "g/cart")) as {
      subtotal: () => number;
      setOther: (n: number) => unknown;
      setItems: (items: { price: number }[]) => unknown;
    };

    const wire = gwm.getWire({}, [], "en", ($) => $);
    const notify = vi.fn();
    wire.subscribe(notify);

    // Prime the memo OUTSIDE the consumer's tracking cassette. The next read
    // inside the cassette will be a cache hit, so the cassette captures only
    // the memo cell (not the underlying StateCell transitively).
    expect(resource.subtotal()).toBe(30);

    const commit = wire.startTracking();
    expect(resource.subtotal()).toBe(30); // cache hit — captures the memo cell as the sole dep
    commit();

    // Touch a field the memo does not depend on → state cell publishes →
    // memo invalidates → recomputes eagerly → output unchanged → memo does
    // NOT notify its subscribers → wire's cassette-dep (the memo) doesn't fire.
    resource.setOther(99);
    expect(notify).not.toHaveBeenCalled();

    // Now actually change the total.
    resource.setItems([{ price: 5 }, { price: 5 }]);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(resource.subtotal()).toBe(10);
  });

  it("action with a no-op partial does not change state and a memoized getter still returns the same value", async () => {
    const { jmInternal } = buildEnv({
      "g/state": makeStatefulOuterGearModule({ a: 1, b: 2 }, (plugin, cursor) => ({
        readA: cursor.getter(() => plugin.$.state.a),
        noop: cursor.action(() => ({ a: 1 })),
      })),
    });

    const resource = (await resolveResource(jmInternal, "g/state")) as { readA: () => number; noop: () => unknown };

    expect(resource.readA()).toBe(1);
    resource.noop();
    expect(resource.readA()).toBe(1);
  });
});
