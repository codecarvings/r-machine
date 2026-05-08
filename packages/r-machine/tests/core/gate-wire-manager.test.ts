import { describe, expect, it, vi } from "vitest";
import { GateWireManager } from "../../src/core/gate-wire-manager.js";
import type { JunctureManager } from "../../src/core/juncture-manager.js";
import type { PluginCtxAugmenter } from "../../src/core/plug.js";
import type { AnyNamespace, AnyNamespaceCollection } from "../../src/core/res-domain.js";
import type { AnyNamespaceMap } from "../../src/core/res-map.js";
import type { VertexGearMap } from "../../src/core/vertex-gear.js";

// --- helpers -----------------------------------------------------------------

interface GetPluginCall {
  readonly kit: AnyNamespaceMap;
  readonly nsDeps: AnyNamespaceCollection;
  readonly locale: string | undefined;
  readonly augmentCtx: PluginCtxAugmenter;
  readonly selfNamespace: AnyNamespace | undefined;
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
      selfNamespace: AnyNamespace | undefined,
      genId: number,
      vertexGearMap: VertexGearMap | undefined
    ): Promise<unknown> {
      getPluginCalls.push({ kit, nsDeps, locale, augmentCtx, selfNamespace, genId, vertexGearMap });
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
  it("getPlugin is called once with the wire's setup state at creation", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    const kit = { foo: "g/foo" } as AnyNamespaceMap;
    const nsDeps = ["g/A", "g/B"];
    const vgm: VertexGearMap = { "v/V": 7 };

    gwm.getWire(kit, nsDeps, "en-US", noopAugmentCtx, vgm);

    expect(mock.getPluginCalls).toHaveLength(1);
    expect(mock.getPluginCalls[0]).toMatchObject({
      kit,
      nsDeps,
      locale: "en-US",
      augmentCtx: noopAugmentCtx,
      selfNamespace: undefined,
      vertexGearMap: vgm,
    });
    // genId is positive (manager allocates monotonically).
    expect(mock.getPluginCalls[0].genId).toBeGreaterThan(0);
  });

  it("getPluginPromise returns the same Promise reference across calls until a notify fires", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);

    const p1 = wire.getPluginPromise();
    const p2 = wire.getPluginPromise();
    const p3 = wire.getPluginPromise();

    expect(p1).toBe(p2);
    expect(p2).toBe(p3);
  });
});

describe("GateWireManager — top-level subscription", () => {
  it("subscribes to top-level namespaces of a list nsDeps", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    gwm.getWire({}, ["g/A", "g/B"], "en-US", noopAugmentCtx);

    expect(mock.subscribersByNs.has("g/A")).toBe(true);
    expect(mock.subscribersByNs.has("g/B")).toBe(true);
  });

  it("subscribes to top-level namespaces of a map nsDeps (the values)", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    gwm.getWire({}, { x: "g/X", y: "g/Y" }, "en-US", noopAugmentCtx);

    expect(mock.subscribersByNs.has("g/X")).toBe(true);
    expect(mock.subscribersByNs.has("g/Y")).toBe(true);
  });
});

describe("GateWireManager — α (lazy reresolve on notify)", () => {
  it("becomes dirty on notify and reresolves at the next getPluginPromise call", async () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const p1 = wire.getPluginPromise();
    expect(mock.getPluginCalls).toHaveLength(1); // setup-only

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
    const gwm = new GateWireManager(mock.jm);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);

    mock.triggerNotify("g/A");

    expect(cb).toHaveBeenCalledOnce();
  });

  it("notifies all React subscribers, surviving exceptions in any one callback", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
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
    const gwm = new GateWireManager(mock.jm);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    const dispose = wire.subscribe(cb);

    dispose();
    mock.triggerNotify("g/A");

    expect(cb).not.toHaveBeenCalled();
  });

  it("on the last unsubscribe, unsubscribes from the JM and disposes all vertex slots for the wire", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
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
    const gwm = new GateWireManager(mock.jm);
    const vgm: VertexGearMap = {};
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx, vgm);
    const callsBefore = mock.getPluginCalls.length;

    wire.updateRequest("en-US", vgm);

    expect(mock.getPluginCalls).toHaveLength(callsBefore); // no reresolve
    expect(mock.disposeOwnershipCalls).toEqual([]);
  });

  it("on locale change, reresolves with the new locale and notifies subscribers (no vertex dispose)", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    const cb = vi.fn();
    wire.subscribe(cb);

    wire.updateRequest("it-IT", undefined);

    // Reresolved with new locale.
    expect(mock.getPluginCalls).toHaveLength(2);
    expect(mock.getPluginCalls[1].locale).toBe("it-IT");
    // No vertex dispose for a pure locale change.
    expect(mock.disposeOwnershipCalls).toEqual([]);
    // React subscribers notified.
    expect(cb).toHaveBeenCalledOnce();
  });

  it("on vertexGearMap change, disposes ownership-changed vertex BEFORE reresolving", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx, undefined);
    const genId = mock.getPluginCalls[0].genId;

    const newVgm: VertexGearMap = { "v/V": 999 };
    wire.updateRequest("en-US", newVgm);

    // Ownership-change dispose fired with new vgm and the wire's genId.
    expect(mock.disposeOwnershipCalls).toEqual([{ genId, vgm: newVgm }]);
    // Reresolve carries the new vgm.
    expect(mock.getPluginCalls).toHaveLength(2);
    expect(mock.getPluginCalls[1].vertexGearMap).toBe(newVgm);
  });

  it("on combined locale + vertexGearMap change, both side effects fire", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    const wire = gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx, undefined);
    const newVgm: VertexGearMap = { "v/V": 1 };

    wire.updateRequest("it-IT", newVgm);

    expect(mock.disposeOwnershipCalls).toHaveLength(1);
    expect(mock.getPluginCalls).toHaveLength(2);
    expect(mock.getPluginCalls[1].locale).toBe("it-IT");
    expect(mock.getPluginCalls[1].vertexGearMap).toBe(newVgm);
  });
});

describe("GateWireManager — genId allocation", () => {
  it("each new wire gets a fresh, monotonically increasing genId", () => {
    const mock = createMockJm();
    const gwm = new GateWireManager(mock.jm);
    gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);
    gwm.getWire({}, ["g/A"], "en-US", noopAugmentCtx);

    const genIds = mock.getPluginCalls.map((c) => c.genId);
    expect(new Set(genIds).size).toBe(3);
    // Strictly increasing within this test (regardless of cross-suite state).
    expect(genIds[1]).toBeGreaterThan(genIds[0]);
    expect(genIds[2]).toBeGreaterThan(genIds[1]);
  });
});
