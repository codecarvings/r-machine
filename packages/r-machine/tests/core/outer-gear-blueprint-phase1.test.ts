import { describe, expect, it, vi } from "vitest";
import type { CassetteRecorder } from "../../src/core/cassette-recorder.js";
import { createOuterGearComposer } from "../../src/core/outer-gear-composer.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import type { ResManager } from "../../src/core/res-manager.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import { buildResolveEnv, type ModuleFactory, type ResolveEnv } from "../_fixtures/build-resolve-env.js";

// --- helpers -----------------------------------------------------------------

const LAYOUT: AnyResLayout = { "g/": "gear:outer" };

// Resolve env wired exactly like RMachine (shared builder), with a gearKit
// auto-derived from the module namespaces — kept for parity with how this suite
// drives the full blueprint stack.
function buildEnv(modules: Record<string, ModuleFactory>): ResolveEnv {
  const gearKit = Object.fromEntries(
    (Object.keys(modules) as AnyNamespace[]).map((ns) => [ns.replace(/[^a-z]/g, ""), ns])
  );
  return buildResolveEnv(LAYOUT, modules, { equipment: { gearKit } });
}

// Builds a stateful OG matrix via the PUBLIC composer (no internal _-prefixed
// helpers). The connector closure dispatches back into rm at factory time.
// Plugin shape under the real ResManager: `{ ...kit, ...deps, $ }`. The
// augmented ctx (state/defaultState/ports/...) lives at `plugin.$`.
function makeStatefulOuterGearModule<S>(
  defaultState: S,
  factory: (plugin: { $: { state: S; defaultState: S } }, cursor: any) => unknown
) {
  return (rm: ResManager, recorder: CassetteRecorder): AnyResModule => {
    const connector: ResComposerConnector = {
      getWire: async (nsDeps, locale, augmentCtx, chain) => {
        const plugin = await rm.getPlugin({}, nsDeps, locale, augmentCtx, chain, 0, undefined);
        return { plugin };
      },
    };
    const composer = createOuterGearComposer<any, any>(connector, recorder);
    const matrix = composer.withState(defaultState).define(factory as never);
    return { r: matrix as unknown as AnyRes };
  };
}

// List-deps variant. Plugin shape under RM is `[...deps, $]` — the cursor
// factory must read `$` from the array's tail, not from `plugin.$` (which is
// undefined on arrays). This module shape exists specifically to exercise that
// path; a regression on the list cursor would surface here.
function makeStatefulOuterGearListModule<S>(
  depNs: readonly AnyNamespace[],
  defaultState: S,
  factory: (plugin: ReadonlyArray<unknown>, cursor: any) => unknown
) {
  return (rm: ResManager, recorder: CassetteRecorder): AnyResModule => {
    const connector: ResComposerConnector = {
      getWire: async (nsDeps, locale, augmentCtx, chain) => {
        const plugin = await rm.getPlugin({}, nsDeps, locale, augmentCtx, chain, 0, undefined);
        return { plugin };
      },
    };
    const composer = createOuterGearComposer<any, any>(connector, recorder);
    const matrix = (composer.withDeps as unknown as (...d: AnyNamespace[]) => any)(...depNs)
      .withState(defaultState)
      .define(factory as never);
    return { r: matrix as unknown as AnyRes };
  };
}

// --- tests -------------------------------------------------------------------

describe("OuterGear stateful — full blueprint stack", () => {
  it("public composer → RM resolve → resource exposes a working getter and action", async () => {
    const env = buildEnv({
      "g/counter": makeStatefulOuterGearModule({ count: 0 }, (plugin, cursor) => ({
        read: cursor.getter(() => plugin.$.state.count),
        add: cursor.action((n: number) => ({ count: plugin.$.state.count + n })),
      })),
    });

    const resource = (await env.resolve("g/counter")) as {
      read: number;
      add: (n: number) => unknown;
    };

    expect(resource.read).toBe(0);
    resource.add(5);
    expect(resource.read).toBe(5);
    resource.add(3);
    expect(resource.read).toBe(8);
  });

  it("cell resolved via the blueprint stack short-circuits on equal output", async () => {
    const bodyCalls = vi.fn();
    const env = buildEnv({
      "g/cart": makeStatefulOuterGearModule({ items: [{ price: 10 }, { price: 20 }], other: 0 }, (plugin, cursor) => ({
        subtotal: cursor.cell(() => {
          bodyCalls();
          return plugin.$.state.items.reduce((s: number, i: { price: number }) => s + i.price, 0);
        }),
        setItems: cursor.action((items: { price: number }[]) => ({ items })),
        setOther: cursor.action((n: number) => ({ other: n })),
      })),
    });

    const resource = (await env.resolve("g/cart")) as {
      subtotal: number;
      setItems: (items: { price: number }[]) => unknown;
      setOther: (n: number) => unknown;
    };

    expect(resource.subtotal).toBe(30);
    expect(bodyCalls).toHaveBeenCalledTimes(1);

    // Hit: body must not run again.
    expect(resource.subtotal).toBe(30);
    expect(bodyCalls).toHaveBeenCalledTimes(1);

    // Invalidation via an action that touches a different key (items unchanged):
    // memo body re-runs once on next read, but returns the same total → still 30.
    resource.setOther(99);
    expect(resource.subtotal).toBe(30);
    expect(bodyCalls).toHaveBeenCalledTimes(2);

    // Now actually change items.
    resource.setItems([{ price: 5 }, { price: 5 }]);
    expect(resource.subtotal).toBe(10);
    expect(bodyCalls).toHaveBeenCalledTimes(3);
  });

  it("commit-tracking via real Wire: action on a tracked OG fires the consumer-supplied notify", async () => {
    const env = buildEnv({
      "g/counter": makeStatefulOuterGearModule({ count: 0 }, (plugin, cursor) => ({
        read: cursor.getter(() => plugin.$.state.count),
        add: cursor.action((n: number) => ({ count: plugin.$.state.count + n })),
      })),
    });

    const resource = (await env.resolve("g/counter")) as {
      read: number;
      add: (n: number) => unknown;
    };

    // Pure consumer-side wire: no nsDeps, just used as a notification channel
    // for cassette-tracked reads. The notify callback is consumer-supplied —
    // in a React hook this is typically a `useReducer`-style forceRerender.
    const wire = env.wm.getWire({}, [], "en", ($) => $);
    const notify = vi.fn();

    const commit = wire.startTracking(notify, {});
    expect(resource.read).toBe(0);
    commit();

    // No mutation yet → no notification.
    expect(notify).not.toHaveBeenCalled();

    // Mutate via the action: the cassette-tracked StateCell publishes →
    // notify fires.
    resource.add(5);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(resource.read).toBe(5);

    // A second action on the same dep fires notify again (subscription is
    // persistent until next commit replaces it).
    resource.add(3);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(resource.read).toBe(8);
  });

  it("cell equality short-circuit propagates through the real Wire: no notify when output unchanged", async () => {
    const env = buildEnv({
      "g/cart": makeStatefulOuterGearModule({ items: [{ price: 10 }, { price: 20 }], other: 0 }, (plugin, cursor) => ({
        subtotal: cursor.cell(() => plugin.$.state.items.reduce((s: number, i: { price: number }) => s + i.price, 0)),
        setOther: cursor.action((n: number) => ({ other: n })),
        setItems: cursor.action((items: { price: number }[]) => ({ items })),
      })),
    });

    const resource = (await env.resolve("g/cart")) as {
      subtotal: number;
      setOther: (n: number) => unknown;
      setItems: (items: { price: number }[]) => unknown;
    };

    const wire = env.wm.getWire({}, [], "en", ($) => $);
    const notify = vi.fn();

    // Prime the memo OUTSIDE the consumer's tracking cassette. The next read
    // inside the cassette will be a cache hit, so the cassette captures only
    // the memo cell (not the underlying StateCell transitively).
    expect(resource.subtotal).toBe(30);

    const commit = wire.startTracking(notify, {});
    expect(resource.subtotal).toBe(30); // cache hit — captures the memo cell as the sole dep
    commit();

    // Touch a field the memo does not depend on → state cell publishes →
    // memo invalidates → recomputes eagerly → output unchanged → memo does
    // NOT notify its subscribers → notify doesn't fire.
    resource.setOther(99);
    expect(notify).not.toHaveBeenCalled();

    // Now actually change the total.
    resource.setItems([{ price: 5 }, { price: 5 }]);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(resource.subtotal).toBe(10);
  });

  it("withDeps(list) + withState — plugin shape `[...deps, $]` resolves the state cell from the array tail", async () => {
    const env = buildEnv({
      "g/session": makeStatefulOuterGearModule({ id: "abc" }, (plugin, cursor) => ({
        getId: cursor.getter(() => plugin.$.state.id),
      })),
      "g/timer": makeStatefulOuterGearListModule(
        ["g/session" as AnyNamespace],
        0,
        ([session, $]: any, cursor: any) => ({
          tick: cursor.getter(),
          label: cursor.getter(() => `${session.getId}:${$.state}`),
          inc: cursor.action(() => $.state + 1),
        })
      ),
    });

    const resource = (await env.resolve("g/timer" as AnyNamespace)) as {
      tick: number;
      label: string;
      inc: () => unknown;
    };

    expect(resource.tick).toBe(0);
    expect(resource.label).toBe("abc:0");
    resource.inc();
    expect(resource.tick).toBe(1);
    expect(resource.label).toBe("abc:1");
  });

  it("action with a no-op partial does not change state and a getter still returns the same value", async () => {
    const env = buildEnv({
      "g/state": makeStatefulOuterGearModule({ a: 1, b: 2 }, (plugin, cursor) => ({
        readA: cursor.getter(() => plugin.$.state.a),
        noop: cursor.action(() => ({ a: 1 })),
      })),
    });

    const resource = (await env.resolve("g/state")) as { readA: number; noop: () => unknown };

    expect(resource.readA).toBe(1);
    resource.noop();
    expect(resource.readA).toBe(1);
  });
});
