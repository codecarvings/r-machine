import { describe, expect, it, vi } from "vitest";
import { GateWireManager } from "../../src/core/gate-wire-manager.js";
import type { JunctureManager } from "../../src/core/juncture-manager.js";
import type { PluginCtxAugmenter } from "../../src/core/plug.js";
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
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const kit = { foo: "g/foo" } as AnyNamespaceMap;
    const nsDeps = ["g/A", "g/B"];
    const vgm: VertexGearMap = { "v/V": 7 };

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
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
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
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
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
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, { x: "g/X", y: "g/Y" }, "en-US", noopAugmentCtx);
    wire.subscribe(() => {});

    expect(mock.subscribersByNs.has("g/X")).toBe(true);
    expect(mock.subscribersByNs.has("g/Y")).toBe(true);
  });
});

describe("GateWireManager — α (lazy reresolve on notify)", () => {
  it("becomes dirty on notify and reresolves at the next getPluginPromise call", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
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
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);

    mock.triggerNotify("g/A");

    expect(cb).toHaveBeenCalledOnce();
  });

  it("notifies all React subscribers, surviving exceptions in any one callback", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
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
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    const dispose = wire.subscribe(cb);

    dispose();
    mock.triggerNotify("g/A");

    expect(cb).not.toHaveBeenCalled();
  });

  it("on the last unsubscribe, unsubscribes from the JM and disposes all vertex slots for the wire", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    // Force a resolve so we can capture the wire's genId.
    wire.getPluginPromise();
    const genId = mock.getPluginCalls[0].genId;

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const dispose1 = wire.subscribe(cb1);
    const dispose2 = wire.subscribe(cb2);

    // First unsubscribe — still has cb2, no cleanup yet.
    dispose1();
    expect(mock.disposeAllCalls).toEqual([]);
    expect(mock.subscribersByNs.get("g/A")?.size).toBe(1);

    // Last unsubscribe — JM unsub + dispose vertex slots.
    dispose2();
    expect(mock.disposeAllCalls).toEqual([genId]);
    expect(mock.subscribersByNs.get("g/A")?.size).toBe(0);
  });
});

describe("GateWireManager — updateRequest", () => {
  it("is a no-op when neither locale nor vertexGearMap changed (identity-equal)", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
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

  it("on locale change, marks dirty and reresolves with the new locale on next read; subscribers notified (no vertex dispose)", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);
    // Initial resolve.
    wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(1);

    wire.updateRequest("it-IT", undefined);

    // Lazy: no reresolve yet.
    expect(mock.getPluginCalls).toHaveLength(1);
    // React subscribers notified synchronously.
    expect(cb).toHaveBeenCalledOnce();
    // No vertex dispose for a pure locale change.
    expect(mock.disposeOwnershipCalls).toEqual([]);

    // Next read triggers reresolve with the new locale.
    wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(2);
    expect(mock.getPluginCalls[1].locale).toBe("it-IT");
  });

  it("on vertexGearMap change, disposes ownership-changed vertex; reresolve carries new vgm on next read", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx, undefined);
    // Initial resolve to capture the wire's genId.
    wire.getPluginPromise();
    const genId = mock.getPluginCalls[0].genId;

    const newVgm: VertexGearMap = { "v/V": 999 };
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
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx, undefined);
    wire.getPluginPromise();
    const newVgm: VertexGearMap = { "v/V": 1 };

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
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
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

describe("GateWireManager — commit-tracking (cassette → wire wiring)", () => {
  it("after commit, a tracked dep mutation notifies the wire's subscribers", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);

    const cell = createStateCell({ v: 0 });
    const commit = wire.startTracking();
    cell.read(); // captured by the open cassette
    commit();

    expect(cb).not.toHaveBeenCalled();
    cell.publish({ v: 1 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cassette-driven notify busts getPluginPromise identity WITHOUT triggering a re-resolve", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    wire.subscribe(() => {});

    const p1 = wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(1);
    const plugin1 = await p1;

    const cell = createStateCell({ v: 0 });
    const commit = wire.startTracking();
    cell.read();
    commit();

    cell.publish({ v: 1 });

    // No re-resolve: JM.getPlugin was not called again.
    expect(mock.getPluginCalls).toHaveLength(1);

    // But the Promise identity is fresh (so useSyncExternalStore sees a change).
    const p2 = wire.getPluginPromise();
    expect(p2).not.toBe(p1);

    // And the new Promise resolves to the same underlying plugin (no work redone).
    const plugin2 = await p2;
    expect(plugin2).toBe(plugin1);
  });

  it("re-commit replaces prior cassette subscriptions: stale deps no longer notify", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);

    const oldCell = createStateCell({ v: 0 });
    const newCell = createStateCell({ v: 0 });

    // First tracking pass: reads oldCell.
    const commit1 = wire.startTracking();
    oldCell.read();
    commit1();
    cb.mockClear();

    // Second tracking pass: reads newCell only.
    const commit2 = wire.startTracking();
    newCell.read();
    commit2();

    oldCell.publish({ v: 99 });
    expect(cb).not.toHaveBeenCalled();

    newCell.publish({ v: 99 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("abandoned tracking (startTracking without commit) is ejected when a new startTracking begins", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);

    const ghost = createStateCell({ v: 0 });
    const real = createStateCell({ v: 0 });

    // First startTracking that never commits (abandoned by the consumer).
    wire.startTracking();
    ghost.read();

    // Second startTracking takes over. The first cassette must have been
    // ejected, so reads inside it stop landing in any active cassette.
    const commit2 = wire.startTracking();
    real.read();
    commit2();

    // Only `real` (recorded by the committed second cassette) notifies.
    real.publish({ v: 1 });
    expect(cb).toHaveBeenCalledTimes(1);
    cb.mockClear();

    // `ghost` reads were never committed; mutating it must not notify.
    ghost.publish({ v: 1 });
    expect(cb).not.toHaveBeenCalled();
  });

  it("calling the commit fn twice is idempotent (second call is a no-op)", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);

    const cell = createStateCell({ v: 0 });
    const commit = wire.startTracking();
    cell.read();
    commit();
    commit(); // second call should be a no-op

    cell.publish({ v: 1 });
    // Single subscription: exactly one notification on the wire's subscriber.
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("on last subscriber leaving, cassette-deps subscriptions are cleared", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm, { bus: undefined });
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    const unsub = wire.subscribe(cb);

    const cell = createStateCell({ v: 0 });
    const commit = wire.startTracking();
    cell.read();
    commit();

    unsub(); // last subscriber leaves — wire fully tears down

    cell.publish({ v: 1 });
    expect(cb).not.toHaveBeenCalled();
  });
});
