import { describe, expect, it, vi } from "vitest";
import { GateWireManager } from "../../src/core/gate-wire-manager.js";
import type { JunctureManager } from "../../src/core/juncture-manager.js";
import type { PluginCtxAugmenter } from "../../src/core/plug.js";
import { createCassetteRecorder } from "../../src/core/reactivity/cassette-recorder.js";
import { createStateCell } from "../../src/core/reactivity/state-cell.js";
import type { AnyNamespace, AnyNamespaceCollection } from "../../src/core/res-domain.js";
import type { AnyNamespaceMap } from "../../src/core/res-map.js";
import type { VertexGearMap } from "../../src/core/vertex-gear.js";

// --- helpers -----------------------------------------------------------------

interface GetPluginCall {
  readonly kit: AnyNamespaceMap;
  readonly nsDeps: AnyNamespaceCollection;
  readonly locale: string | undefined;
  readonly augmentCtx: PluginCtxAugmenter;
  readonly chain: readonly AnyNamespace[];
  readonly genId: number;
  readonly vertexGearMap: VertexGearMap | undefined;
}

interface MockJm {
  readonly jm: JunctureManager;
  readonly getPluginCalls: GetPluginCall[];
  readonly disposeAllCalls: number[];
  readonly disposeOwnershipCalls: { genId: number; vgm: VertexGearMap | undefined }[];
  readonly subscribersByNs: Map<AnyNamespace, Set<() => void>>;
  triggerNotify(ns: AnyNamespace): void;
}

// Lightweight JM stand-in: records every call and exposes subscriber sets
// so tests can fire JM-side notifications and verify orchestration.
function createMockJm(): MockJm {
  const getPluginCalls: GetPluginCall[] = [];
  const disposeAllCalls: number[] = [];
  const disposeOwnershipCalls: { genId: number; vgm: VertexGearMap | undefined }[] = [];
  const subscribersByNs = new Map<AnyNamespace, Set<() => void>>();
  let pluginIdx = 0;

  const jm = {
    getPlugin(
      kit: AnyNamespaceMap,
      nsDeps: AnyNamespaceCollection,
      locale: string | undefined,
      augmentCtx: PluginCtxAugmenter,
      chain: readonly AnyNamespace[],
      genId: number,
      vertexGearMap: VertexGearMap | undefined
    ): Promise<unknown> {
      getPluginCalls.push({ kit, nsDeps, locale, augmentCtx, chain, genId, vertexGearMap });
      return Promise.resolve({ pluginId: pluginIdx++ });
    },
    subscribe(nsList: Iterable<AnyNamespace>, callback: () => void): () => void {
      const subscribed: AnyNamespace[] = [];
      for (const ns of nsList) {
        let set = subscribersByNs.get(ns);
        if (!set) {
          set = new Set();
          subscribersByNs.set(ns, set);
        }
        set.add(callback);
        subscribed.push(ns);
      }
      return () => {
        for (const ns of subscribed) {
          subscribersByNs.get(ns)?.delete(callback);
        }
      };
    },
    disposeAllVertexSlotsByGenId(genId: number): void {
      disposeAllCalls.push(genId);
    },
    disposeVertexSlotsByOwnershipChange(genId: number, vgm: VertexGearMap | undefined): void {
      disposeOwnershipCalls.push({ genId, vgm });
    },
  };

  return {
    jm: jm as unknown as JunctureManager,
    getPluginCalls,
    disposeAllCalls,
    disposeOwnershipCalls,
    subscribersByNs,
    triggerNotify(ns: AnyNamespace): void {
      const set = subscribersByNs.get(ns);
      if (!set) {
        throw new Error(`No subscribers registered for "${ns}"`);
      }
      for (const cb of set) {
        cb();
      }
    },
  };
}

const noopAugmentCtx: PluginCtxAugmenter = ($) => $;

// --- tests -------------------------------------------------------------------

describe("GateWireManager — setup", () => {
  it("getPlugin is not called at creation (lazy resolve), but on first getPluginPromise read with the wire's setup state", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const kit = { foo: "g/foo" } as AnyNamespaceMap;
    const nsDeps = ["g/A", "g/B"];
    // vgm value side is now an opaque composite vertexKey (string).
    const vgm: VertexGearMap = { "v/V": "7\x1f0" };

    const wire = gwm.getWire(kit, nsDeps, "en-US", noopAugmentCtx, vgm);

    // No resolve until someone reads the promise.
    expect(mock.getPluginCalls).toHaveLength(0);

    wire.getPluginPromise();

    expect(mock.getPluginCalls).toHaveLength(1);
    expect(mock.getPluginCalls[0]).toMatchObject({
      kit,
      nsDeps,
      locale: "en-US",
      augmentCtx: noopAugmentCtx,
      vertexGearMap: vgm,
    });
    // genId is positive (manager allocates monotonically).
    expect(mock.getPluginCalls[0].genId).toBeGreaterThan(0);
  });

  it("getPluginPromise returns the same Promise reference across calls until a notify fires", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);

    const p1 = wire.getPluginPromise();
    const p2 = wire.getPluginPromise();
    const p3 = wire.getPluginPromise();

    expect(p1).toBe(p2);
    expect(p2).toBe(p3);
  });
});

describe("GateWireManager — top-level subscription", () => {
  it("does not subscribe to JM at creation (lazy), only on first external subscriber", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A", "g/B"], "en-US", noopAugmentCtx);

    // No JM subscription before someone subscribes to the wire.
    expect(mock.subscribersByNs.has("g/A")).toBe(false);
    expect(mock.subscribersByNs.has("g/B")).toBe(false);

    wire.subscribe(() => {});

    expect(mock.subscribersByNs.has("g/A")).toBe(true);
    expect(mock.subscribersByNs.has("g/B")).toBe(true);
  });

  it("subscribes to top-level namespaces of a map nsDeps (the values)", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, { x: "g/X", y: "g/Y" }, "en-US", noopAugmentCtx);
    wire.subscribe(() => {});

    expect(mock.subscribersByNs.has("g/X")).toBe(true);
    expect(mock.subscribersByNs.has("g/Y")).toBe(true);
  });
});

describe("GateWireManager — α (lazy reresolve on notify)", () => {
  it("becomes dirty on notify and reresolves at the next getPluginPromise call", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    // Subscribe to ensure the wire subscribes to the JM (lazy).
    wire.subscribe(() => {});
    const p1 = wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(1); // first read triggers resolve

    // JM-side cascade reaches subscribers of "g/A".
    mock.triggerNotify("g/A");

    // Notify alone does NOT trigger reresolve (lazy).
    expect(mock.getPluginCalls).toHaveLength(1);

    const p2 = wire.getPluginPromise();
    // First read after notify triggers reresolve.
    expect(mock.getPluginCalls).toHaveLength(2);
    expect(p2).not.toBe(p1);

    // Subsequent reads return the same reference until the next notify.
    const p3 = wire.getPluginPromise();
    expect(p3).toBe(p2);
    expect(mock.getPluginCalls).toHaveLength(2);
  });

  it("notifies React subscribers synchronously when JM-side notify fires", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);

    mock.triggerNotify("g/A");

    expect(cb).toHaveBeenCalledOnce();
  });

  it("notifies all React subscribers, surviving exceptions in any one callback", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const cb1 = vi.fn(() => {
      throw new Error("boom");
    });
    const cb2 = vi.fn();
    wire.subscribe(cb1);
    wire.subscribe(cb2);

    mock.triggerNotify("g/A");

    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
    errSpy.mockRestore();
  });
});

describe("GateWireManager — subscribe / dispose", () => {
  it("returns a disposer that removes the callback (no further notifications)", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    const dispose = wire.subscribe(cb);

    dispose();
    mock.triggerNotify("g/A");

    expect(cb).not.toHaveBeenCalled();
  });

  it("on the last unsubscribe, defers JM unsub + vertex slot dispose to a microtask (skipped if a resubscribe lands first)", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    // Force a resolve so we can capture the wire's genId.
    wire.getPluginPromise();
    const genId = mock.getPluginCalls[0].genId;

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const dispose1 = wire.subscribe(cb1);
    const dispose2 = wire.subscribe(cb2);

    // First unsubscribe — still has cb2, no cleanup queued.
    dispose1();
    await Promise.resolve();
    expect(mock.disposeAllCalls).toEqual([]);
    expect(mock.subscribersByNs.get("g/A")?.size).toBe(1);

    // Last unsubscribe — deferred to microtask; nothing torn down synchronously.
    dispose2();
    expect(mock.disposeAllCalls).toEqual([]);
    expect(mock.subscribersByNs.get("g/A")?.size).toBe(1);

    // After microtask flush — JM unsub + vertex slot dispose.
    await Promise.resolve();
    expect(mock.disposeAllCalls).toEqual([genId]);
    expect(mock.subscribersByNs.get("g/A")?.size).toBe(0);
  });

  it("if a resubscribe lands in the same tick as the last unsubscribe, no teardown fires (React Strict Mode / Suspense fallback toggle)", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    wire.getPluginPromise();

    const cb1 = vi.fn();
    const dispose1 = wire.subscribe(cb1);

    // Last unsubscribe followed immediately by a fresh subscribe — the
    // microtask should see subscribers.size > 0 and bail.
    dispose1();
    const cb2 = vi.fn();
    wire.subscribe(cb2);

    await Promise.resolve();

    expect(mock.disposeAllCalls).toEqual([]);
    expect(mock.subscribersByNs.get("g/A")?.size).toBe(1);
  });
});

describe("GateWireManager — updateRequest", () => {
  it("is a no-op when neither locale nor vertexGearMap changed (identity-equal)", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const vgm: VertexGearMap = {};
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx, vgm);
    // Force initial resolve so we can detect any further reresolve.
    wire.getPluginPromise();
    const callsBefore = mock.getPluginCalls.length;

    wire.updateRequest("en-US", vgm);
    // Reading after no-op update: still cached, no new resolve.
    wire.getPluginPromise();

    expect(mock.getPluginCalls).toHaveLength(callsBefore); // no reresolve
    expect(mock.disposeOwnershipCalls).toEqual([]);
  });

  it("on locale change, marks dirty and reresolves with the new locale on next read; subscribers notified (no vertex dispose)", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);
    // Initial resolve.
    wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(1);

    wire.updateRequest("it-IT", undefined);

    // Lazy: no reresolve yet.
    expect(mock.getPluginCalls).toHaveLength(1);
    // No vertex dispose for a pure locale change.
    expect(mock.disposeOwnershipCalls).toEqual([]);

    // Subscribers notified after a microtask. updateRequest is typically
    // invoked mid-render (a consumer switching locale calls it from inside
    // its render fn); deferring shields React from "Cannot update a
    // component while rendering a different component" warnings when those
    // subscribers are useSyncExternalStore callbacks.
    expect(cb).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(cb).toHaveBeenCalledOnce();

    // Next read triggers reresolve with the new locale.
    wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(2);
    expect(mock.getPluginCalls[1].locale).toBe("it-IT");
  });

  it("on vertexGearMap change, disposes ownership-changed vertex; reresolve carries new vgm on next read", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx, undefined);
    // Initial resolve to capture the wire's genId.
    wire.getPluginPromise();
    const genId = mock.getPluginCalls[0].genId;

    const newVgm: VertexGearMap = { "v/V": "999\x1f0" };
    wire.updateRequest("en-US", newVgm);

    // Ownership-change dispose fired immediately with new vgm and the wire's genId.
    expect(mock.disposeOwnershipCalls).toEqual([{ genId, vgm: newVgm }]);

    // Reresolve happens lazily on next read, with the new vgm.
    wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(2);
    expect(mock.getPluginCalls[1].vertexGearMap).toBe(newVgm);
  });

  it("on combined locale + vertexGearMap change, both side effects fire and next read reresolves", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx, undefined);
    wire.getPluginPromise();
    const newVgm: VertexGearMap = { "v/V": "1\x1f0" };

    wire.updateRequest("it-IT", newVgm);

    // Vertex-ownership dispose fired immediately.
    expect(mock.disposeOwnershipCalls).toHaveLength(1);

    // Reresolve happens lazily.
    wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(2);
    expect(mock.getPluginCalls[1].locale).toBe("it-IT");
    expect(mock.getPluginCalls[1].vertexGearMap).toBe(newVgm);
  });
});

describe("GateWireManager — genId allocation", () => {
  it("each new wire gets a fresh, monotonically increasing genId", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, createCassetteRecorder());
    const w1 = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const w2 = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const w3 = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    // Force resolves to capture genIds via the JM mock.
    w1.getPluginPromise();
    w2.getPluginPromise();
    w3.getPluginPromise();

    const genIds = mock.getPluginCalls.map((c) => c.genId);
    expect(new Set(genIds).size).toBe(3);
    // Strictly increasing within this test (regardless of cross-suite state).
    expect(genIds[1]).toBeGreaterThan(genIds[0]);
    expect(genIds[2]).toBeGreaterThan(genIds[1]);
  });
});

describe("GateWireManager — commit-tracking (cassette → consumer-notify channel)", () => {
  it("after commit, a tracked dep mutation fires the consumer-supplied notify", () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const notify = vi.fn();

    const cell = createStateCell({ v: 0 }, recorder);
    const commit = wire.startTracking(notify, {});
    cell.read(); // captured by the open cassette
    commit();

    expect(notify).not.toHaveBeenCalled();
    cell.publish({ v: 1 });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("cassette-driven notify does NOT bust getPluginPromise identity (no Suspense churn)", async () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    wire.subscribe(() => {});

    const p1 = wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(1);

    const cell = createStateCell({ v: 0 }, recorder);
    const commit = wire.startTracking(() => {}, {});
    cell.read();
    commit();

    cell.publish({ v: 1 });

    // No re-resolve and no Promise identity churn: the Promise is the JM
    // resolution channel only. Cassette deps notify the consumer directly.
    expect(mock.getPluginCalls).toHaveLength(1);
    const p2 = wire.getPluginPromise();
    expect(p2).toBe(p1);
  });

  it("the wire's `subscribe` channel does NOT fire on cassette-tracked mutations", () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const wireSub = vi.fn();
    wire.subscribe(wireSub);

    const cell = createStateCell({ v: 0 }, recorder);
    const commit = wire.startTracking(() => {}, {});
    cell.read();
    commit();

    cell.publish({ v: 1 });

    // wire.subscribers is the JM-driven channel only. Cassette mutations do
    // NOT flow through it. (A JM-side notify or updateRequest is what fires
    // wire subscribers — see the α tests above.)
    expect(wireSub).not.toHaveBeenCalled();
  });

  it("re-commit replaces prior cassette subscriptions: stale deps no longer notify", () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const notify = vi.fn();

    const oldCell = createStateCell({ v: 0 }, recorder);
    const newCell = createStateCell({ v: 0 }, recorder);
    // Same consumer across both passes — re-commit semantics applies to a
    // single consumer's repeated render cycle, not to two sibling consumers.
    const consumer = {};

    // First tracking pass: reads oldCell.
    const commit1 = wire.startTracking(notify, consumer);
    oldCell.read();
    commit1();
    notify.mockClear();

    // Second tracking pass: reads newCell only.
    const commit2 = wire.startTracking(notify, consumer);
    newCell.read();
    commit2();

    oldCell.publish({ v: 99 });
    expect(notify).not.toHaveBeenCalled();

    newCell.publish({ v: 99 });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("abandoned tracking (startTracking without commit) is superseded by a new startTracking", () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const notify = vi.fn();

    const ghost = createStateCell({ v: 0 }, recorder);
    const real = createStateCell({ v: 0 }, recorder);
    // Same consumer: epoch supersedure is what guarantees the ghost reads
    // don't end up wired (the per-consumer cassette is bubbled to top and
    // its deps cleared on the second insert).
    const consumer = {};

    // First startTracking that never commits (abandoned by the consumer).
    wire.startTracking(notify, consumer);
    ghost.read();

    // Second startTracking takes over. insert() on the consumer's cassette
    // clears the ghost deps; the per-consumer epoch bumps, making the first
    // commit closure a no-op even if it were to fire.
    const commit2 = wire.startTracking(notify, consumer);
    real.read();
    commit2();

    // Only `real` (recorded by the committed second cassette) notifies.
    real.publish({ v: 1 });
    expect(notify).toHaveBeenCalledTimes(1);
    notify.mockClear();

    // `ghost` reads were never committed; mutating it must not notify.
    ghost.publish({ v: 1 });
    expect(notify).not.toHaveBeenCalled();
  });

  it("calling the commit fn twice is idempotent (second call is a no-op)", () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const notify = vi.fn();

    const cell = createStateCell({ v: 0 }, recorder);
    const commit = wire.startTracking(notify, {});
    cell.read();
    commit();
    commit(); // second call should be a no-op

    cell.publish({ v: 1 });
    // Single subscription: exactly one notification.
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("cassette-deps subscriptions persist across wire-subscribe drops to zero (Strict Mode dev safety)", () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);

    const notify = vi.fn();
    const cell = createStateCell({ v: 0 }, recorder);
    const commit = wire.startTracking(notify, {});
    cell.read();
    commit();

    // Simulate the Strict Mode subscribe→unsubscribe→subscribe dance:
    // useSyncExternalStore drops subscribers to zero between mounts.
    const unsub = wire.subscribe(() => {});
    unsub();

    // Cassette subs MUST survive synchronously — wire-level teardown
    // (including disposeAllConsumers) is now deferred to a microtask. The
    // dance's resubscribe lands before the microtask and short-circuits it.
    cell.publish({ v: 1 });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("disposeConsumer clears a single consumer's subs without touching siblings (multi-consumer wire)", () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);

    const cellA = createStateCell({ v: 0 }, recorder);
    const cellB = createStateCell({ v: 0 }, recorder);
    const notifyA = vi.fn();
    const notifyB = vi.fn();
    const consumerA = {};
    const consumerB = {};

    // Each consumer tracks its own cell on the SAME wire.
    const commitA = wire.startTracking(notifyA, consumerA);
    cellA.read();
    commitA();

    const commitB = wire.startTracking(notifyB, consumerB);
    cellB.read();
    commitB();

    // Both alive: each cell publish fires only its own notify.
    cellA.publish({ v: 1 });
    expect(notifyA).toHaveBeenCalledTimes(1);
    expect(notifyB).not.toHaveBeenCalled();
    cellB.publish({ v: 1 });
    expect(notifyB).toHaveBeenCalledTimes(1);

    // Dispose A only — B must keep working.
    wire.disposeConsumer(consumerA);
    notifyA.mockClear();
    notifyB.mockClear();

    cellA.publish({ v: 2 });
    expect(notifyA).not.toHaveBeenCalled();

    cellB.publish({ v: 2 });
    expect(notifyB).toHaveBeenCalledTimes(1);
  });

  it("two consumers on the same wire each receive notifications when they share a tracked cell (regression: clearCassetteSubs / shared-epoch bug)", () => {
    const mock = createMockJm();
    const recorder = createCassetteRecorder();
    const gwm = new GateWireManager(mock.jm, { bus: undefined }, recorder);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);

    const sharedCell = createStateCell({ v: 0 }, recorder);
    const notifyA = vi.fn();
    const notifyB = vi.fn();

    const commitA = wire.startTracking(notifyA, {});
    sharedCell.read();
    commitA();

    const commitB = wire.startTracking(notifyB, {});
    sharedCell.read();
    commitB();

    sharedCell.publish({ v: 1 });
    // Pre-fix: only the latest commit's notify fired (notifyB), because
    // clearCassetteSubs() was wire-wide.
    expect(notifyA).toHaveBeenCalledTimes(1);
    expect(notifyB).toHaveBeenCalledTimes(1);
  });
});
