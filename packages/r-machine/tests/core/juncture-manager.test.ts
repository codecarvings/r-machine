import { describe, expect, it, vi } from "vitest";
import { BlueprintManager } from "../../src/core/blueprint-manager.js";
import type { BusHost } from "../../src/core/event-bus.js";
import { getJunctureResCacheKey, JunctureManager } from "../../src/core/juncture-manager.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResEquipment } from "../../src/core/res-equipment.js";
import { type AnyResLayout, ResLayoutResolver } from "../../src/core/res-layout.js";
import type { AnyNamespaceMap } from "../../src/core/res-map.js";
import { createResMatrix } from "../../src/core/res-matrix.js";
import type { AnyResModule, ResModuleLoaderFnOptions } from "../../src/core/res-module.js";
import { buildVertexKey } from "../../src/core/vertex-gear.js";
import {
  ERR_CIRCULAR_DEPENDENCY,
  ERR_VERTEX_INSTANCE_NOT_FOUND,
  RMachineResolveError,
} from "../../src/errors/index.js";
import {
  collectEvents,
  expectEventBefore,
  expectEventSequence,
  makeTestBridge,
} from "../_fixtures/event-bus-helpers.js";

// --- helpers -----------------------------------------------------------------

// Layout: g/* = inner gear, b/* = base gear (raw-resource compatible),
// s/* = shell, v/* = outer vertex gear.
const TEST_LAYOUT: AnyResLayout = {
  "g/": "gear:inner",
  "b/": "gear:base",
  "s/": "shell",
  "v/": "gear:outer(vertex)",
};

// A raw-resource module — only valid for layout types that accept raw
// resources (gear:inner, gear:base, shell). The JM does NOT call any factory
// for these, so this is the simplest module type for slot/lifecycle testing.
function makeRawModule(resource: AnyRes): AnyResModule {
  return { r: resource };
}

// A vertex (outer-gear) matrix module. Layout type "gear:outer(vertex)"
// requires a matrix factory — raw resources are rejected by createBlueprint.
// The connector dispatches back into the JM at factory-runtime via the jm
// argument captured at module-creation time.
function makeVertexModule(jm: JunctureManager, kit: AnyNamespaceMap, resource: AnyRes): AnyResModule {
  const head = {
    realm: "res",
    family: "gear",
    mode: "list",
    deps: [],
    nsDeps: [],
    nsDepList: [],
    ports: {},
  };
  const connector: ResComposerConnector = {
    getWire: async (nsDeps, locale, augmentCtx, chain) => {
      const plugin = await jm.getPlugin(kit, nsDeps, locale, augmentCtx, chain, 0, undefined);
      return { plugin };
    },
  };
  const matrix = createResMatrix({
    connector,
    meta: { family: "gear", role: "outer" },
    head: head as never,
    cursor: undefined,
    userFactory: async () => resource,
  });
  return { r: matrix };
}

// Generic gear matrix module (inner/base/outer). The userFactory receives the
// resolved plugin (a list `[...deps, $]`), so the test can both verify
// kit access works in non-cyclic cases and assert cycle errors when the
// factory body reaches into a cyclic kit entry.
function makeGearModule(
  jm: JunctureManager,
  kit: AnyNamespaceMap,
  role: "inner" | "base" | "outer",
  deps: readonly AnyNamespace[],
  userFactory: (plugin: readonly unknown[]) => unknown
): AnyResModule {
  const head = {
    realm: "res",
    family: "gear",
    mode: "list",
    deps,
    nsDeps: deps,
    nsDepList: deps,
    ports: {},
  };
  const connector: ResComposerConnector = {
    getWire: async (nsDeps, locale, augmentCtx, chain) => {
      const plugin = await jm.getPlugin(kit, nsDeps, locale, augmentCtx, chain, 0, undefined);
      return { plugin };
    },
  };
  const matrix = createResMatrix({
    connector,
    meta: { family: "gear", role },
    head: head as never,
    cursor: undefined,
    userFactory: async (plugin) => userFactory(plugin as readonly unknown[]),
  });
  return { r: matrix };
}

interface JmTestEnvOptions {
  // Module factories receive the constructed JM so they can wire connectors
  // (matrix modules need to dispatch back into JM.getPlugin at factory-runtime).
  // Raw modules can ignore the parameter.
  readonly modules: Record<string, (jm: JunctureManager) => AnyResModule | Promise<AnyResModule>>;
  readonly gearKit?: Record<string, AnyNamespace>;
  readonly shellKit?: Record<string, AnyNamespace>;
  readonly bridgeGears?: AnyNamespace[];
  readonly priority?: AnyNamespace[];
  // Optional bus host. When omitted, the env wires `{ bus: undefined }` —
  // emit call-sites short-circuit at zero cost and no event flows. Pass a
  // bridge from `makeTestBridge()` when the test needs to observe events.
  readonly busHost?: BusHost;
}

function createJmTestEnv(options: JmTestEnvOptions) {
  const loadCalls: string[] = [];

  // jm is captured by the loader closure but only constructed below.
  // Module factories that need jm (matrix-based ones) receive it lazily —
  // by the time the loader runs (during a getBlueprint call), jm is set.
  let jm!: JunctureManager;

  const loader = async (_path: string, opts?: ResModuleLoaderFnOptions): Promise<AnyResModule> => {
    if (!opts) {
      throw new Error("expected ResModuleLoaderFnOptions");
    }
    loadCalls.push(opts.namespace);
    const factory = options.modules[opts.namespace];
    if (!factory) {
      throw new Error(`No module registered for "${opts.namespace}"`);
    }
    return factory(jm);
  };

  const resolver = new ResLayoutResolver(TEST_LAYOUT);
  const equipment: AnyResEquipment = {
    gearKit: options.gearKit ?? {},
    shellKit: options.shellKit ?? {},
    bridgeGears: options.bridgeGears ?? [],
  };
  const busHost: BusHost = options.busHost ?? { bus: undefined };
  const bm = new BlueprintManager(
    resolver,
    loader,
    {
      gear: Object.values(equipment.gearKit),
      shell: Object.values(equipment.shellKit),
    },
    options.priority ?? [],
    busHost
  );
  jm = new JunctureManager(resolver, equipment, bm, busHost);

  // Test-only inspectors: protected fields are read-only here for assertions.
  const bmInternal = bm as unknown as {
    forwardDeps: Map<AnyNamespace, Set<AnyNamespace>>;
    reverseDeps: Map<AnyNamespace, Set<AnyNamespace>>;
    keysByNs: Map<AnyNamespace, Set<string>>;
  };
  const jmInternal = jm as unknown as {
    slots: Map<string, { key: string; namespace: AnyNamespace; generation: number; content: unknown }>;
    generationByNs: Map<AnyNamespace, number>;
    subscribersByNs: Map<AnyNamespace, Set<() => void>>;
    vertexSlotsByGenId: Map<number, Map<AnyNamespace, Set<string>>>;
    getJuncture(
      namespace: AnyNamespace,
      locale: string | undefined,
      genId: number,
      vertexGearMap: Record<AnyNamespace, string> | undefined,
      chain: readonly AnyNamespace[],
      occurrenceTag?: string
    ): Promise<unknown>;
  };

  return {
    bm,
    jm,
    bmInternal,
    jmInternal,
    triggerHmr: (ns: string, locale?: string) => {
      const layoutType = resolver.resolveLayoutEntryType(ns as AnyNamespace);
      const path = resolver.resolvePath(ns as AnyNamespace, locale, layoutType);
      bm.reloadModule(path);
    },
    loadCalls,
    // For non-vertex layouts (kit, base, inner, shell, outer non-vertex) the
    // 3rd arg is ignored. For vertex, pass the composite `vertexKey`
    // (= `buildVertexKey(genId, occurrenceTag)`) or a pre-built `genId`+`tag`
    // pair via the convenience overload below.
    keyOf: (ns: string, locale?: string, vertexKey?: string) =>
      getJunctureResCacheKey(ns, locale, resolver.resolveLayoutEntryType(ns), vertexKey),
    vKey: (genId: number, occurrenceTag = "") => buildVertexKey(genId, occurrenceTag),
    // Manually wire a forward/reverse dep edge to simulate a matrix-loaded
    // blueprint without going through createResMatrix machinery. This keeps
    // JM tests focused on JM behavior — the BM's eager dep graph
    // construction is exercised in blueprint-manager.test.ts.
    addDepEdge: (from: AnyNamespace, to: AnyNamespace) => {
      let fwd = bmInternal.forwardDeps.get(from);
      if (!fwd) {
        fwd = new Set();
        bmInternal.forwardDeps.set(from, fwd);
      }
      fwd.add(to);
      let rev = bmInternal.reverseDeps.get(to);
      if (!rev) {
        rev = new Set();
        bmInternal.reverseDeps.set(to, rev);
      }
      rev.add(from);
    },
  };
}

// --- tests -------------------------------------------------------------------

describe("JunctureManager — slot model", () => {
  it("creates a slot when a non-vertex namespace is resolved for the first time", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);

    const slot = env.jmInternal.slots.get(env.keyOf("g/X"));
    expect(slot).toBeDefined();
    expect(slot?.namespace).toBe("g/X");
    expect(slot?.generation).toBe(0);
  });

  it("captures the current per-ns generation when a slot is created", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });
    // Bump generation BEFORE first resolve.
    env.jmInternal.generationByNs.set("g/X", 5);

    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);

    const slot = env.jmInternal.slots.get(env.keyOf("g/X"));
    expect(slot?.generation).toBe(5);
  });

  it("reuses an existing fresh slot on subsequent resolves", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);
    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);

    // Module loaded only once — slot reused.
    expect(env.loadCalls.filter((n) => n === "g/X").length).toBe(1);
  });

  it("re-resolves when a slot is stale (generation mismatch)", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);
    const firstSlot = env.jmInternal.slots.get(env.keyOf("g/X"));
    expect(firstSlot?.generation).toBe(0);

    // Bump generation manually to simulate an HMR cascade (without going
    // through invalidate, which would also dispose the slot — here we want
    // to verify that getJuncture itself treats a stale slot as a miss).
    env.jmInternal.generationByNs.set("g/X", 1);

    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);

    const secondSlot = env.jmInternal.slots.get(env.keyOf("g/X"));
    // A fresh slot replaced the stale one, with the new generation captured.
    expect(secondSlot?.generation).toBe(1);
    expect(secondSlot).not.toBe(firstSlot);
  });
});

describe("JunctureManager — vertex slot tracking", () => {
  it("registers a vertex namespace under its genId when a creator slot is allocated", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
    });

    await env.jmInternal.getJuncture("v/V", undefined, 42, undefined, [], "tagA");

    // Two-level index: outer genId → inner Map<ns, Set<occurrenceTag>>.
    expect(env.jmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["tagA"])]]));
    expect(env.jmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(42, "tagA")))).toBe(true);
  });

  it("emits vertexSlotRegistered, then resolveStart, then slotCommitted on the creator path", async () => {
    const bridge = makeTestBridge();
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    await env.jmInternal.getJuncture("v/V", undefined, 42, undefined, [], "0");

    // Sparse match: between resolveStart and slotCommitted the resolve path
    // also emits factoryInvoked and built — irrelevant for the ordering
    // invariant under test.
    expectEventSequence(collector.events, [
      { type: "juncture:vertexSlotRegistered", namespace: "v/V", genId: 42, occurrenceTag: "0" },
      { type: "juncture:resolveStart", namespace: "v/V", vertexGenId: 42 },
      { type: "juncture:built", namespace: "v/V", kind: "outer" },
      { type: "juncture:slotCommitted", namespace: "v/V" },
    ]);

    collector.dispose();
  });

  it("reuses an existing vertex slot for the same (ns, genId, occurrenceTag) triple", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
    });

    await env.jmInternal.getJuncture("v/V", undefined, 42, undefined, [], "0");
    await env.jmInternal.getJuncture("v/V", undefined, 42, undefined, [], "0");

    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
  });

  it("creates TWO distinct slots for the same (ns, genId) with different occurrenceTags", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
    });

    await env.jmInternal.getJuncture("v/V", undefined, 42, undefined, [], "0");
    await env.jmInternal.getJuncture("v/V", undefined, 42, undefined, [], "1");

    // Two factory invocations because the tags discriminate distinct slots.
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(2);
    expect(env.jmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["0", "1"])]]));
    expect(env.jmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(42, "0")))).toBe(true);
    expect(env.jmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(42, "1")))).toBe(true);
  });

  it("resolves a vertex consumer to the parent's existing slot via vertexGearMap", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
    });
    // Parent creates the vertex with genId 42 at tag "0".
    await env.jmInternal.getJuncture("v/V", undefined, 42, undefined, [], "0");
    const parentVKey = env.vKey(42, "0");
    const parentSlot = env.jmInternal.slots.get(env.keyOf("v/V", undefined, parentVKey));

    // Child consumes it via the inherited vertexGearMap. The vgm value is
    // the parent's opaque composite `vertexKey` — child uses it verbatim
    // to land on the same slot.
    const consumed = await env.jmInternal.getJuncture("v/V", undefined, 999, { "v/V": parentVKey }, []);

    // Same juncture content as the parent — no new load triggered.
    expect(consumed).toBe(parentSlot?.content);
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
  });

  it("throws ERR_VERTEX_INSTANCE_NOT_FOUND when a consumer references a non-existent parent vertex", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
    });

    try {
      await env.jmInternal.getJuncture("v/V", undefined, 999, { "v/V": env.vKey(42, "0") }, []);
      expect.unreachable("expected getJuncture to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineResolveError);
      expect((error as RMachineResolveError).code).toBe(ERR_VERTEX_INSTANCE_NOT_FOUND);
    }
  });
});

describe("JunctureManager — vertex dispose APIs", () => {
  it("disposeVertexSlotsForNamespace removes ALL slots of (ns, genId) — including multiple occurrence tags — from the index and the slots map", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/A": (jm) => makeVertexModule(jm, {}, { a: 1 }),
        "v/B": (jm) => makeVertexModule(jm, {}, { b: 2 }),
      },
    });
    // Two distinct slots for v/A (tags "0" and "1") under the same genId.
    await env.jmInternal.getJuncture("v/A", undefined, 42, undefined, [], "0");
    await env.jmInternal.getJuncture("v/A", undefined, 42, undefined, [], "1");
    await env.jmInternal.getJuncture("v/B", undefined, 42, undefined, [], "0");

    env.jm.disposeVertexSlotsForNamespace("v/A", 42);

    // Both v/A occurrences gone; v/B intact.
    expect(env.jmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/B", new Set(["0"])]]));
    expect(env.jmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "0")))).toBe(false);
    expect(env.jmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "1")))).toBe(false);
    expect(env.jmInternal.slots.has(env.keyOf("v/B", undefined, env.vKey(42, "0")))).toBe(true);
  });

  it("disposeAllVertexSlotsByGenId removes every vertex slot (any ns, any tag) created under a genId", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/A": (jm) => makeVertexModule(jm, {}, { a: 1 }),
        "v/B": (jm) => makeVertexModule(jm, {}, { b: 2 }),
      },
    });
    await env.jmInternal.getJuncture("v/A", undefined, 42, undefined, [], "0");
    await env.jmInternal.getJuncture("v/A", undefined, 42, undefined, [], "1");
    await env.jmInternal.getJuncture("v/B", undefined, 42, undefined, [], "0");

    const disposed = env.jm.disposeAllVertexSlotsByGenId(42);

    expect(disposed).toBe(3);
    expect(env.jmInternal.vertexSlotsByGenId.has(42)).toBe(false);
    expect(env.jmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "0")))).toBe(false);
    expect(env.jmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "1")))).toBe(false);
    expect(env.jmInternal.slots.has(env.keyOf("v/B", undefined, env.vKey(42, "0")))).toBe(false);
  });

  it("disposeVertexSlotsByOwnershipChange disposes only vertex now owned by a parent", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/A": (jm) => makeVertexModule(jm, {}, { a: 1 }),
        "v/B": (jm) => makeVertexModule(jm, {}, { b: 2 }),
      },
    });
    await env.jmInternal.getJuncture("v/A", undefined, 42, undefined, [], "0");
    await env.jmInternal.getJuncture("v/B", undefined, 42, undefined, [], "0");

    // Simulate an updateRequest where v/A now has a parent owner. The vgm
    // value is the parent's opaque vertexKey — its content doesn't matter
    // for the "is this ns now covered" decision.
    env.jm.disposeVertexSlotsByOwnershipChange(42, { "v/A": env.vKey(7, "0") });

    // v/A disposed, v/B kept.
    expect(env.jmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/B", new Set(["0"])]]));
    expect(env.jmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "0")))).toBe(false);
    expect(env.jmInternal.slots.has(env.keyOf("v/B", undefined, env.vKey(42, "0")))).toBe(true);
  });

  it("invokes Symbol.dispose when disposing a resolved vertex slot", async () => {
    const teardown = vi.fn();
    const env = createJmTestEnv({
      modules: {
        "v/A": (jm) => makeVertexModule(jm, {}, { a: 1, [Symbol.dispose]: teardown }),
      },
    });
    await env.jmInternal.getJuncture("v/A", undefined, 42, undefined, [], "0");

    env.jm.disposeVertexSlotsForNamespace("v/A", 42);

    expect(teardown).toHaveBeenCalledOnce();
  });
});

describe("JunctureManager — vertex duplicate-deps in a single Plug", () => {
  it("list-mode: two duplicate vertex deps under one wire create two distinct slots, each factory invoked once", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
    });

    // Simulates `Plug("v/V", "v/V").useR()` resolving under one wire's genId.
    const plugin = (await env.jm.getPlugin({}, ["v/V", "v/V"], undefined, () => {}, [], 42, undefined)) as unknown[];

    // Two distinct slots → two factory invocations → distinct resource
    // identities exposed in the plugin's deps array.
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(2);
    expect(plugin[0]).not.toBe(plugin[1]);
    expect(env.jmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["0", "1"])]]));
  });

  it("list-mode: two duplicate vertex deps under one wire, COVERED by vertexGearMap, share the parent's slot", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
    });

    // Parent wire creates the vertex once.
    await env.jmInternal.getJuncture("v/V", undefined, 7, undefined, [], "0");
    const parentVKey = env.vKey(7, "0");

    // Consumer wire has two duplicate deps but the namespace is covered by
    // the parent's vgm — both occurrences must resolve to the parent's slot.
    const plugin = (await env.jm.getPlugin({}, ["v/V", "v/V"], undefined, () => {}, [], 99, {
      "v/V": parentVKey,
    })) as unknown[];

    // Only the parent's single factory invocation; no extra loads.
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
    expect(plugin[0]).toBe(plugin[1]);
    // No NEW vertex slots were registered under the consumer wire's genId.
    expect(env.jmInternal.vertexSlotsByGenId.has(99)).toBe(false);
  });

  it("map-mode: two map keys mapped to the same vertex namespace create two distinct slots", async () => {
    const env = createJmTestEnv({
      modules: {
        "v/V": (jm) => makeVertexModule(jm, {}, { v: 1 }),
      },
    });

    // Simulates `Plug({ a: "v/V", b: "v/V" }).useR()`.
    const plugin = (await env.jm.getPlugin({}, { a: "v/V", b: "v/V" }, undefined, () => {}, [], 42, undefined)) as {
      a: unknown;
      b: unknown;
    };

    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(2);
    expect(plugin.a).not.toBe(plugin.b);
    // Tags come from the map keys (`"a"`, `"b"`), not numeric positions.
    expect(env.jmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["a", "b"])]]));
  });
});

describe("JunctureManager — stale resolve teardown", () => {
  it("emits resolveStale with reason 'generation' and teardownInvoked=true when generation bumps mid-flight", async () => {
    const bridge = makeTestBridge();
    const teardown = vi.fn();
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const env = createJmTestEnv({
      modules: {
        "g/X": async () => {
          await gate;
          return makeRawModule({ x: 1, [Symbol.dispose]: teardown });
        },
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    // Kick off the resolve without awaiting — it will park on `gate` inside
    // the module factory (which is awaited inside BlueprintManager.loadModule).
    const inflight = env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);
    // Bump the generation while the factory is suspended. invalidate also
    // calls disposeSlot, but the slot's content is still a Promise at this
    // point — disposeSlot only removes the entry from the slots map, the
    // teardown will be invoked on the discarded juncture at the stale-check
    // path in resolveJuncture.
    env.jm.invalidate("g/X");
    // Now release the factory — the resolve completes, builds the juncture,
    // hits the stale check, and emits resolveStale.
    releaseGate();
    await inflight;

    expectEventSequence(collector.events, [
      "juncture:resolveStart",
      "juncture:invalidationStart",
      { type: "juncture:resolveStale", namespace: "g/X", reason: "generation", teardownInvoked: true },
    ]);
    // The discarded juncture's Symbol.dispose was actually invoked.
    expect(teardown).toHaveBeenCalledOnce();
    // No slotCommitted event for this resolve — the juncture was thrown away.
    expect(collector.events.some((e) => e.type === "juncture:slotCommitted")).toBe(false);

    collector.dispose();
  });

  it("emits resolveStale with reason 'slotIdentity' when the slot is dropped mid-flight without a generation bump", async () => {
    const bridge = makeTestBridge();
    const teardown = vi.fn();
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const env = createJmTestEnv({
      modules: {
        "g/X": async () => {
          await gate;
          return makeRawModule({ x: 1, [Symbol.dispose]: teardown });
        },
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    const inflight = env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);
    // Drop the slot directly from the protected map. No generation bump
    // happens, so the only stale-check trigger left is slot-identity
    // mismatch (slot's captured reference !== slots.get(key)).
    env.jmInternal.slots.delete(env.keyOf("g/X"));
    releaseGate();
    await inflight;

    expectEventSequence(collector.events, [
      "juncture:resolveStart",
      { type: "juncture:resolveStale", namespace: "g/X", reason: "slotIdentity", teardownInvoked: true },
    ]);
    expect(teardown).toHaveBeenCalledOnce();
    expect(collector.events.some((e) => e.type === "juncture:slotCommitted")).toBe(false);

    collector.dispose();
  });
});

describe("JunctureManager — invalidate cascade", () => {
  it("bumps generation, evicts the blueprint, and notifies subscribers", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });
    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);

    const callback = vi.fn();
    env.jm.subscribe(["g/X"], callback);

    env.jm.invalidate("g/X");

    expect(env.jmInternal.generationByNs.get("g/X")).toBe(1);
    expect(env.bmInternal.keysByNs.has("g/X")).toBe(false);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("disposes resolved slots in the closure (with Symbol.dispose invoked)", async () => {
    const teardown = vi.fn();
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1, [Symbol.dispose]: teardown }),
      },
    });
    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);

    env.jm.invalidate("g/X");

    expect(teardown).toHaveBeenCalledOnce();
    expect(env.jmInternal.slots.has(env.keyOf("g/X"))).toBe(false);
  });

  it("disposes slots in dispose-safe order (dependents before deps)", async () => {
    // Dep graph: g/A depends on g/B. Reverse closure of B = [A, B].
    // Dispose order must be [A, B] — A's teardown could reference B.
    const bridge = makeTestBridge();
    const teardownOrder: string[] = [];
    const env = createJmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1, [Symbol.dispose]: () => teardownOrder.push("g/A") }),
        "g/B": () => makeRawModule({ b: 1, [Symbol.dispose]: () => teardownOrder.push("g/B") }),
      },
      busHost: bridge,
    });
    // Manually wire the dep graph: A → B.
    env.addDepEdge("g/A", "g/B");

    await env.jmInternal.getJuncture("g/A", undefined, 0, undefined, []);
    await env.jmInternal.getJuncture("g/B", undefined, 0, undefined, []);

    // Attach the collector only now so the buffer captures the invalidate
    // pass alone (no warm-up resolveStart/slotCommitted noise).
    const collector = collectEvents(bridge);

    env.jm.invalidate("g/B");

    expect(teardownOrder).toEqual(["g/A", "g/B"]);

    // Cross-check via the bus: juncture:slotDisposed events must mirror the
    // teardown order. Catches a future bug where teardown still runs but
    // the dispose event is forgotten / fired out of order.
    const disposedNs = collector.events.flatMap((e) => (e.type === "juncture:slotDisposed" ? [e.namespace] : []));
    expect(disposedNs).toEqual(["g/A", "g/B"]);

    collector.dispose();
  });

  it("notifies all subscribers of namespaces in the closure", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 1 }),
      },
    });
    env.addDepEdge("g/A", "g/B");

    const cbA = vi.fn();
    const cbB = vi.fn();
    env.jm.subscribe(["g/A"], cbA);
    env.jm.subscribe(["g/B"], cbB);

    env.jm.invalidate("g/B");

    // Both A (dependent of B) and B itself are in the closure.
    expect(cbA).toHaveBeenCalledOnce();
    expect(cbB).toHaveBeenCalledOnce();
  });

  it("does not notify subscribers outside the closure", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/Other": () => makeRawModule({ o: 1 }),
      },
    });

    const cbOther = vi.fn();
    env.jm.subscribe(["g/Other"], cbOther);

    env.jm.invalidate("g/A");

    expect(cbOther).not.toHaveBeenCalled();
  });

  it("emits blueprint:evicted before juncture:subscribersNotified for each namespace in the closure", async () => {
    // Invariant: any subscriber callback triggered by an invalidate must
    // see a FRESH BPM cache. The JM cascade enforces this by evicting all
    // blueprints in the closure (step 3) BEFORE firing the
    // subscribersNotified events (step 4). A regression where the loops
    // are interleaved would silently re-introduce stale-cache reads from
    // subscriber callbacks — undetectable without bus assertions.
    const bridge = makeTestBridge();
    const env = createJmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 1 }),
      },
      busHost: bridge,
    });
    // Dep graph: A depends on B. Reverse closure of B = [A, B].
    env.addDepEdge("g/A", "g/B");
    await env.jmInternal.getJuncture("g/A", undefined, 0, undefined, []);
    await env.jmInternal.getJuncture("g/B", undefined, 0, undefined, []);

    // Two subscribers — one per namespace in the closure. Both must be
    // present so notifications actually fire (and the order assertion has
    // both endpoints to compare).
    env.jm.subscribe(["g/A"], () => {});
    env.jm.subscribe(["g/B"], () => {});

    const collector = collectEvents(bridge);

    env.jm.invalidate("g/B");

    // Per-namespace ordering: each ns's eviction precedes its notify.
    expectEventBefore(
      collector.events,
      { type: "blueprint:evicted", namespace: "g/A" },
      { type: "juncture:subscribersNotified", namespace: "g/A" }
    );
    expectEventBefore(
      collector.events,
      { type: "blueprint:evicted", namespace: "g/B" },
      { type: "juncture:subscribersNotified", namespace: "g/B" }
    );

    collector.dispose();
  });
});

describe("JunctureManager — subscribe", () => {
  it("returns a disposer that removes the callback", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    const cb = vi.fn();
    const dispose = env.jm.subscribe(["g/X"], cb);
    dispose();

    env.jm.invalidate("g/X");

    expect(cb).not.toHaveBeenCalled();
  });

  it("registers the same callback on multiple namespaces and unsubscribes from all on disposer", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 1 }),
      },
    });

    const cb = vi.fn();
    const dispose = env.jm.subscribe(["g/A", "g/B"], cb);

    env.jm.invalidate("g/A");
    expect(cb).toHaveBeenCalledTimes(1);

    dispose();
    env.jm.invalidate("g/B");
    // No additional call — the subscription was fully torn down.
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cleans up empty subscriber sets after the last unsubscribe", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    const dispose = env.jm.subscribe(["g/X"], () => {});
    expect(env.jmInternal.subscribersByNs.has("g/X")).toBe(true);

    dispose();

    expect(env.jmInternal.subscribersByNs.has("g/X")).toBe(false);
  });
});

describe("JunctureManager — HMR end-to-end via reloadModule", () => {
  it("HMR triggered through bm.reloadModule flows into invalidate", async () => {
    const env = createJmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });
    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);
    expect(env.jmInternal.generationByNs.get("g/X") ?? 0).toBe(0);

    env.triggerHmr("g/X");

    expect(env.jmInternal.generationByNs.get("g/X")).toBe(1);
    expect(env.jmInternal.slots.has(env.keyOf("g/X"))).toBe(false);
  });

  it("locale-scoped reloadModule disposes only the matching shell slot", async () => {
    const env = createJmTestEnv({
      modules: {
        "s/Y": () => makeRawModule({ greeting: "hi" }),
      },
    });

    await env.jmInternal.getJuncture("s/Y", "en", 0, undefined, []);
    await env.jmInternal.getJuncture("s/Y", "it", 0, undefined, []);

    const enKey = env.keyOf("s/Y", "en");
    const itKey = env.keyOf("s/Y", "it");
    expect(env.jmInternal.slots.has(enKey)).toBe(true);
    expect(env.jmInternal.slots.has(itKey)).toBe(true);

    // HMR on the `en` shell file: only the `en` slot must be disposed.
    env.triggerHmr("s/Y", "en");

    expect(env.jmInternal.slots.has(enKey)).toBe(false);
    expect(env.jmInternal.slots.has(itKey)).toBe(true);
    // Generation is namespace-only — both locales now read stale on next get.
    expect(env.jmInternal.generationByNs.get("s/Y")).toBe(1);
  });
});

describe("JunctureManager — getPlugin kit partition", () => {
  it("partitions all kit entries as eager when chain is empty", async () => {
    const bridge = makeTestBridge();
    const env = createJmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 1 }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    await env.jm.getPlugin({ a: "g/A", b: "g/B" }, [], undefined, () => {}, [], 0, undefined);

    const partition = collector.events.find((e) => e.type === "juncture:kitPartitioned");
    expect(partition).toMatchObject({
      type: "juncture:kitPartitioned",
      selfNamespace: undefined,
      eager: ["g/A", "g/B"],
      deferred: [],
    });

    collector.dispose();
  });

  it("partitions in-chain entries as deferred and the rest as eager", async () => {
    const bridge = makeTestBridge();
    const env = createJmTestEnv({
      modules: {
        // Only g/A needs to be loadable — g/B is deferred (in chain), and
        // the deferred-kit getter that JM installs for it is never invoked
        // in this test (no consumer reads $.kit.b).
        "g/A": () => makeRawModule({ a: 1 }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    await env.jm.getPlugin({ a: "g/A", b: "g/B" }, [], undefined, () => {}, ["g/B"], 0, undefined);

    const partition = collector.events.find((e) => e.type === "juncture:kitPartitioned");
    expect(partition).toMatchObject({
      type: "juncture:kitPartitioned",
      selfNamespace: "g/B",
      eager: ["g/A"],
      deferred: ["g/B"],
    });

    collector.dispose();
  });

  it("emits selfNamespace = chain[last] when the chain has multiple ancestors", async () => {
    const bridge = makeTestBridge();
    const env = createJmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    await env.jm.getPlugin(
      { a: "g/A", b: "g/B", c: "g/C" },
      [],
      undefined,
      () => {},
      // g/B and g/C are both transitive ancestors. g/C is the innermost
      // (most recently entered) — its juncture is what `chain[last]`
      // semantically identifies as "self" for kit purposes.
      ["g/B", "g/C"],
      0,
      undefined
    );

    const partition = collector.events.find((e) => e.type === "juncture:kitPartitioned");
    expect(partition).toMatchObject({
      type: "juncture:kitPartitioned",
      selfNamespace: "g/C",
      eager: ["g/A"],
      deferred: ["g/B", "g/C"],
    });

    collector.dispose();
  });
});

describe("JunctureManager — runtime cycle through kit", () => {
  it("kit-mate access during recursive resolve does not deadlock when the factory does not touch the cyclic kit entry", async () => {
    // b/A is a kit gear (in gearKit). b/B is a regular gear that A depends on.
    // Without the chain mechanism, B's factory's loadKit would await A's
    // juncture (cached as Promise) → deadlock. With the chain, A is replaced
    // by a cyclic accessor in B's $.kit, and B's factory (which doesn't read
    // it) completes normally.
    const env = createJmTestEnv({
      gearKit: { a: "b/A" },
      modules: {
        "b/A": (jm) =>
          makeGearModule(jm, { a: "b/A" }, "base", ["b/B"], ([b]) => ({
            value: (b as { name: string }).name,
          })),
        "b/B": (jm) =>
          makeGearModule(jm, { a: "b/A" }, "base", [], () => ({
            name: "B",
          })),
      },
    });

    const result = await env.jmInternal.getJuncture("b/A", "en", 0, undefined, []);

    expect(result).toMatchObject({ res: { value: "B" } });
  });

  it("$.kit access on a cyclic ancestor throws ERR_CIRCULAR_DEPENDENCY with a clear message", async () => {
    // Same shape as above, but B's factory reads $.kit.a — which is a
    // cyclic-kit accessor at this point. The Proxy throws on the property
    // read; the error bubbles up through the JM's resolveJuncture chain.
    const env = createJmTestEnv({
      gearKit: { a: "b/A" },
      modules: {
        "b/A": (jm) =>
          makeGearModule(jm, { a: "b/A" }, "base", ["b/B"], ([b]) => ({
            value: (b as { name: string }).name,
          })),
        "b/B": (jm) =>
          makeGearModule(jm, { a: "b/A" }, "base", [], (plugin) => {
            // Plugin is [...deps, $]. Reach into $.kit.a — cyclic accessor.
            const $ = plugin[plugin.length - 1] as { kit: { a: { something: unknown } } };
            return { stolenFromA: $.kit.a.something };
          }),
      },
    });

    try {
      await env.jmInternal.getJuncture("b/A", "en", 0, undefined, []);
      expect.unreachable("expected getJuncture to throw a circular-kit error");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineResolveError);
      const e = error as RMachineResolveError;
      expect(e.code).toBe(ERR_CIRCULAR_DEPENDENCY);
      expect(e.message).toContain("b/A");
    }
  });

  it("emits juncture:deferredKitAccessed with ready=false on the cyclic accessor read", async () => {
    // Same setup as the previous test; here we observe the bus event that
    // fires inside the deferred-kit getter just before it throws. This is
    // the only place where `deferredKitAccessed { ready: false }` is
    // emitted — no state on the JM or BPM exposes this signal otherwise.
    const bridge = makeTestBridge();
    const env = createJmTestEnv({
      gearKit: { a: "b/A" },
      modules: {
        "b/A": (jm) =>
          makeGearModule(jm, { a: "b/A" }, "base", ["b/B"], ([b]) => ({
            value: (b as { name: string }).name,
          })),
        "b/B": (jm) =>
          makeGearModule(jm, { a: "b/A" }, "base", [], (plugin) => {
            const $ = plugin[plugin.length - 1] as { kit: { a: { something: unknown } } };
            return { stolenFromA: $.kit.a.something };
          }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    try {
      await env.jmInternal.getJuncture("b/A", "en", 0, undefined, []);
      expect.unreachable("expected getJuncture to throw a circular-kit error");
    } catch {
      // Expected — see previous test for the error-shape assertions.
    }

    // The accessor for b/A (the cyclic ancestor) fires exactly once, with
    // ready=false. The throw inside the getter follows synchronously, but
    // the event is emitted BEFORE the throw (see source comment in
    // juncture-manager.ts:createDeferredKitGetter).
    const accessEvents = collector.events.filter((e) => e.type === "juncture:deferredKitAccessed");
    expect(accessEvents).toHaveLength(1);
    expect(accessEvents[0]).toMatchObject({
      type: "juncture:deferredKitAccessed",
      namespace: "b/A",
      ready: false,
    });

    collector.dispose();
  });
});
