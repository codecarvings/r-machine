import { describe, expect, it, vi } from "vitest";
import { BlueprintManager } from "../../src/core/blueprint-manager.js";
import type { BusHost } from "../../src/core/event-bus.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResEquipment } from "../../src/core/res-equipment.js";
import { type AnyResLayout, ResLayoutResolver } from "../../src/core/res-layout.js";
import type { ResModuleLoaderFnOptions } from "../../src/core/res-loader.js";
import { getResCacheKey, ResManager } from "../../src/core/res-manager.js";
import type { AnyNamespaceMap } from "../../src/core/res-map.js";
import { createResMatrix } from "../../src/core/res-matrix.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import { createRequestScope, PROCESS_SCOPE_PROVIDER, type RequestScopeProvider } from "../../src/core/scope.js";
import { ASYNC, COVERED_PENDING } from "../../src/core/sync-resolve.js";
import { buildVertexKey } from "../../src/core/vertex-gear.js";
import {
  ERR_CIRCULAR_DEPENDENCY,
  ERR_VERTEX_AT_PROCESS_SCOPE,
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
// resources (gear:inner, gear:base, shell). The RM does NOT call any factory
// for these, so this is the simplest module type for slot/lifecycle testing.
function makeRawModule(resource: AnyRes): AnyResModule {
  return { r: resource };
}

// A vertex (outer-gear) matrix module. Layout type "gear:outer(vertex)"
// requires a matrix factory — raw resources are rejected by createBlueprint.
// The connector dispatches back into the rM at factory-runtime via the rm
// argument captured at module-creation time.
function makeVertexModule(rm: ResManager, kit: AnyNamespaceMap, resource: AnyRes): AnyResModule {
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
      const plugin = await rm.getPlugin(kit, nsDeps, locale, augmentCtx, chain, 0, undefined);
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

// A vertex module with a SYNCHRONOUS user factory and a connector that exposes
// `getWireSync` — i.e. a module that becomes Tier-B sync-eligible after its
// first async resolve. Used to exercise `resolvePodSync` (sync vertex creation
// from a cached blueprint).
function makeSyncVertexModule(rm: ResManager, kit: AnyNamespaceMap, makeResource: () => AnyRes): AnyResModule {
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
      const plugin = await rm.getPlugin(kit, nsDeps, locale, augmentCtx, chain, 0, undefined);
      return { plugin };
    },
    getWireSync: (nsDeps, locale, augmentCtx, chain) => {
      const plugin = rm.getPluginSync(kit, nsDeps, locale, augmentCtx, chain, 0, undefined);
      return plugin === ASYNC ? ASYNC : { plugin };
    },
  };
  const matrix = createResMatrix({
    connector,
    meta: { family: "gear", role: "outer" },
    head: head as never,
    cursor: undefined,
    // Synchronous factory → proves sync-eligible on the first async resolve.
    userFactory: () => makeResource(),
  });
  return { r: matrix };
}

// Generic gear matrix module (inner/base/outer). The userFactory receives the
// resolved plugin (a list `[...deps, $]`), so the test can both verify
// kit access works in non-cyclic cases and assert cycle errors when the
// factory body reaches into a cyclic kit entry.
function makeGearModule(
  rm: ResManager,
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
      const plugin = await rm.getPlugin(kit, nsDeps, locale, augmentCtx, chain, 0, undefined);
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

interface RmTestEnvOptions {
  // Module factories receive the constructed RM so they can wire connectors
  // (matrix modules need to dispatch back into RM.getPlugin at factory-runtime).
  // Raw modules can ignore the parameter.
  readonly modules: Record<string, (rm: ResManager) => AnyResModule | Promise<AnyResModule>>;
  readonly gearKit?: Record<string, AnyNamespace>;
  readonly shellKit?: Record<string, AnyNamespace>;
  readonly bridgeGears?: AnyNamespace[];
  readonly priority?: AnyNamespace[];
  // Optional bus host. When omitted, the env wires `{ bus: undefined }` —
  // emit call-sites short-circuit at zero cost and no event flows. Pass a
  // bridge from `makeTestBridge()` when the test needs to observe events.
  readonly busHost?: BusHost;
}

function createRmTestEnv(options: RmTestEnvOptions) {
  const loadCalls: string[] = [];

  // rm is captured by the loader closure but only constructed below.
  // Module factories that need rm (matrix-based ones) receive it lazily —
  // by the time the loader runs (during a getBlueprint call), rm is set.
  let rm!: ResManager;

  const loader = async (_path: string, opts?: ResModuleLoaderFnOptions): Promise<AnyResModule> => {
    if (!opts) {
      throw new Error("expected ResModuleLoaderFnOptions");
    }
    loadCalls.push(opts.namespace);
    const factory = options.modules[opts.namespace];
    if (!factory) {
      throw new Error(`No module registered for "${opts.namespace}"`);
    }
    return factory(rm);
  };

  const resolver = new ResLayoutResolver(TEST_LAYOUT);
  const equipment: AnyResEquipment = {
    gearKit: options.gearKit ?? {},
    shellKit: options.shellKit ?? {},
    bridgeGears: options.bridgeGears ?? [],
    directKit: {},
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
  rm = new ResManager(resolver, equipment, bm, busHost);

  // Test-only inspectors: protected fields are read-only here for assertions.
  const bmInternal = bm as unknown as {
    forwardDeps: Map<AnyNamespace, Set<AnyNamespace>>;
    reverseDeps: Map<AnyNamespace, Set<AnyNamespace>>;
    keysByNs: Map<AnyNamespace, Set<string>>;
  };
  const rmInternal = rm as unknown as {
    slots: Map<string, { key: string; namespace: AnyNamespace; generation: number; content: unknown }>;
    generationByNs: Map<AnyNamespace, number>;
    subscribersByNs: Map<AnyNamespace, Set<() => void>>;
    vertexSlotsByGenId: Map<number, Map<AnyNamespace, Set<string>>>;
    getPod(
      namespace: AnyNamespace,
      locale: string | undefined,
      genId: number,
      vertexGearMap: Record<AnyNamespace, string> | undefined,
      chain: readonly AnyNamespace[],
      occurrenceTag?: string
    ): Promise<unknown>;
    getPodSync(
      namespace: AnyNamespace,
      locale: string | undefined,
      genId: number,
      vertexGearMap: Record<AnyNamespace, string> | undefined,
      chain: readonly AnyNamespace[],
      occurrenceTag?: string
    ): unknown;
  };

  return {
    bm,
    rm,
    bmInternal,
    rmInternal,
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
      getResCacheKey(ns, locale, resolver.resolveLayoutEntryType(ns), vertexKey),
    vKey: (genId: number, occurrenceTag = "") => buildVertexKey(genId, occurrenceTag),
    // Manually wire a forward/reverse dep edge to simulate a matrix-loaded
    // blueprint without going through createResMatrix machinery. This keeps
    // RM tests focused on RM behavior — the BM's eager dep graph
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

describe("ResManager — slot model", () => {
  it("creates a slot when a non-vertex namespace is resolved for the first time", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);

    const slot = env.rmInternal.slots.get(env.keyOf("g/X"));
    expect(slot).toBeDefined();
    expect(slot?.namespace).toBe("g/X");
    expect(slot?.generation).toBe(0);
  });

  it("captures the current per-ns generation when a slot is created", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });
    // Bump generation BEFORE first resolve.
    env.rmInternal.generationByNs.set("g/X", 5);

    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);

    const slot = env.rmInternal.slots.get(env.keyOf("g/X"));
    expect(slot?.generation).toBe(5);
  });

  it("reuses an existing fresh slot on subsequent resolves", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);
    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);

    // Module loaded only once — slot reused.
    expect(env.loadCalls.filter((n) => n === "g/X").length).toBe(1);
  });

  it("re-resolves when a slot is stale (generation mismatch)", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);
    const firstSlot = env.rmInternal.slots.get(env.keyOf("g/X"));
    expect(firstSlot?.generation).toBe(0);

    // Bump generation manually to simulate an HMR cascade (without going
    // through invalidate, which would also dispose the slot — here we want
    // to verify that getPod itself treats a stale slot as a miss).
    env.rmInternal.generationByNs.set("g/X", 1);

    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);

    const secondSlot = env.rmInternal.slots.get(env.keyOf("g/X"));
    // A fresh slot replaced the stale one, with the new generation captured.
    expect(secondSlot?.generation).toBe(1);
    expect(secondSlot).not.toBe(firstSlot);
  });
});

describe("ResManager — vertex slot tracking", () => {
  it("registers a vertex namespace under its genId when a creator slot is allocated", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "tagA");

    // Two-level index: outer genId → inner Map<ns, Set<occurrenceTag>>.
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["tagA"])]]));
    expect(env.rmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(42, "tagA")))).toBe(true);
  });

  it("emits vertexSlotRegistered, then resolveStart, then slotCommitted on the creator path", async () => {
    const bridge = makeTestBridge();
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");

    // Sparse match: between resolveStart and slotCommitted the resolve path
    // also emits factoryInvoked and built — irrelevant for the ordering
    // invariant under test.
    expectEventSequence(collector.events, [
      { type: "res:vertexSlotRegistered", namespace: "v/V", genId: 42, occurrenceTag: "0" },
      { type: "res:resolveStart", namespace: "v/V", vertexGenId: 42 },
      { type: "res:built", namespace: "v/V" },
      { type: "res:slotCommitted", namespace: "v/V" },
    ]);

    collector.dispose();
  });

  it("reuses an existing vertex slot for the same (ns, genId, occurrenceTag) triple", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");
    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");

    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
  });

  it("creates TWO distinct slots for the same (ns, genId) with different occurrenceTags", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");
    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "1");

    // The blueprint (module) is loaded ONCE — it is keyed per-namespace, shared
    // across instances. The two tags still discriminate two distinct SLOTS
    // (the factory runs per slot, producing independent pods).
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["0", "1"])]]));
    expect(env.rmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(42, "0")))).toBe(true);
    expect(env.rmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(42, "1")))).toBe(true);
  });

  it("resolves a vertex consumer to the parent's existing slot via vertexGearMap", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });
    // Parent creates the vertex with genId 42 at tag "0".
    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");
    const parentVKey = env.vKey(42, "0");
    const parentSlot = env.rmInternal.slots.get(env.keyOf("v/V", undefined, parentVKey));

    // Child consumes it via the inherited vertexGearMap. The vgm value is
    // the parent's opaque composite `vertexKey` — child uses it verbatim
    // to land on the same slot.
    const consumed = await env.rmInternal.getPod("v/V", undefined, 999, { "v/V": parentVKey }, []);

    // Same pod content as the parent — no new load triggered.
    expect(consumed).toBe(parentSlot?.content);
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
  });

  it("throws ERR_VERTEX_INSTANCE_NOT_FOUND when a consumer references a non-existent parent vertex", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    try {
      await env.rmInternal.getPod("v/V", undefined, 999, { "v/V": env.vKey(42, "0") }, []);
      expect.unreachable("expected getPod to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineResolveError);
      expect((error as RMachineResolveError).code).toBe(ERR_VERTEX_INSTANCE_NOT_FOUND);
    }
  });

  // genId 0 is the reserved process/kit sentinel (wires start at 1). A vertex
  // slot minted under it would never be disposed (disposal is per-genId at wire
  // teardown). The typed API forbids vertex namespaces in a kit / gear→gear
  // deps, so these guards only fire on an untyped breach — but they must fail
  // loud rather than leak a phantom slot.
  it("throws ERR_VERTEX_AT_PROCESS_SCOPE when a vertex is resolved at genId 0 (async getPod)", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    try {
      await env.rmInternal.getPod("v/V", undefined, 0, undefined, [], "0");
      expect.unreachable("expected getPod to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineResolveError);
      expect((error as RMachineResolveError).code).toBe(ERR_VERTEX_AT_PROCESS_SCOPE);
    }

    // No phantom slot or index entry left behind under the sentinel genId.
    expect(env.rmInternal.vertexSlotsByGenId.has(0)).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(0, "0")))).toBe(false);
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(0);
  });

  it("throws ERR_VERTEX_AT_PROCESS_SCOPE when a vertex is resolved at genId 0 (sync getPodSync)", () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeSyncVertexModule(rm, {}, () => ({ v: 1 })),
      },
    });

    try {
      env.rmInternal.getPodSync("v/V", undefined, 0, undefined, [], "0");
      expect.unreachable("expected getPodSync to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineResolveError);
      expect((error as RMachineResolveError).code).toBe(ERR_VERTEX_AT_PROCESS_SCOPE);
    }

    expect(env.rmInternal.vertexSlotsByGenId.has(0)).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(0, "0")))).toBe(false);
  });
});

describe("ResManager — vertex dispose APIs", () => {
  it("disposeVertexSlotsForNamespace removes ALL slots of (ns, genId) — including multiple occurrence tags — from the index and the slots map", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/A": (rm) => makeVertexModule(rm, {}, { a: 1 }),
        "v/B": (rm) => makeVertexModule(rm, {}, { b: 2 }),
      },
    });
    // Two distinct slots for v/A (tags "0" and "1") under the same genId.
    await env.rmInternal.getPod("v/A", undefined, 42, undefined, [], "0");
    await env.rmInternal.getPod("v/A", undefined, 42, undefined, [], "1");
    await env.rmInternal.getPod("v/B", undefined, 42, undefined, [], "0");

    env.rm.disposeVertexSlotsForNamespace("v/A", 42);

    // Both v/A occurrences gone; v/B intact.
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/B", new Set(["0"])]]));
    expect(env.rmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "0")))).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "1")))).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/B", undefined, env.vKey(42, "0")))).toBe(true);
  });

  it("disposeAllVertexSlotsByGenId removes every vertex slot (any ns, any tag) created under a genId", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/A": (rm) => makeVertexModule(rm, {}, { a: 1 }),
        "v/B": (rm) => makeVertexModule(rm, {}, { b: 2 }),
      },
    });
    await env.rmInternal.getPod("v/A", undefined, 42, undefined, [], "0");
    await env.rmInternal.getPod("v/A", undefined, 42, undefined, [], "1");
    await env.rmInternal.getPod("v/B", undefined, 42, undefined, [], "0");

    const disposed = env.rm.disposeAllVertexSlotsByGenId(42);

    expect(disposed).toBe(3);
    expect(env.rmInternal.vertexSlotsByGenId.has(42)).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "0")))).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "1")))).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/B", undefined, env.vKey(42, "0")))).toBe(false);
  });

  it("disposeVertexSlotsByOwnershipChange disposes only vertex now owned by a parent", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/A": (rm) => makeVertexModule(rm, {}, { a: 1 }),
        "v/B": (rm) => makeVertexModule(rm, {}, { b: 2 }),
      },
    });
    await env.rmInternal.getPod("v/A", undefined, 42, undefined, [], "0");
    await env.rmInternal.getPod("v/B", undefined, 42, undefined, [], "0");

    // Simulate an updateRequest where v/A now has a parent owner. The vgm
    // value is the parent's opaque vertexKey — its content doesn't matter
    // for the "is this ns now covered" decision.
    env.rm.disposeVertexSlotsByOwnershipChange(42, { "v/A": env.vKey(7, "0") });

    // v/A disposed, v/B kept.
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/B", new Set(["0"])]]));
    expect(env.rmInternal.slots.has(env.keyOf("v/A", undefined, env.vKey(42, "0")))).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/B", undefined, env.vKey(42, "0")))).toBe(true);
  });

  it("invokes Symbol.dispose when disposing a resolved vertex slot", async () => {
    const teardown = vi.fn();
    const env = createRmTestEnv({
      modules: {
        "v/A": (rm) => makeVertexModule(rm, {}, { a: 1, [Symbol.dispose]: teardown }),
      },
    });
    await env.rmInternal.getPod("v/A", undefined, 42, undefined, [], "0");

    env.rm.disposeVertexSlotsForNamespace("v/A", 42);

    expect(teardown).toHaveBeenCalledOnce();
  });
});

describe("ResManager — vertex duplicate-deps in a single Plug", () => {
  it("list-mode: two duplicate vertex deps under one wire create two distinct slots, each factory invoked once", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    // Simulates `Plug("v/V", "v/V").useR()` resolving under one wire's genId.
    const plugin = (await env.rm.getPlugin({}, ["v/V", "v/V"], undefined, () => {}, [], 42, undefined)) as unknown[];

    // One shared blueprint load (keyed per-namespace), but two distinct slots →
    // the factory still runs per slot → distinct resource identities in the
    // plugin's deps array.
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
    expect(plugin[0]).not.toBe(plugin[1]);
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["0", "1"])]]));
  });

  it("list-mode: two duplicate vertex deps under one wire, COVERED by vertexGearMap, share the parent's slot", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    // Parent wire creates the vertex once.
    await env.rmInternal.getPod("v/V", undefined, 7, undefined, [], "0");
    const parentVKey = env.vKey(7, "0");

    // Consumer wire has two duplicate deps but the namespace is covered by
    // the parent's vgm — both occurrences must resolve to the parent's slot.
    const plugin = (await env.rm.getPlugin({}, ["v/V", "v/V"], undefined, () => {}, [], 99, {
      "v/V": parentVKey,
    })) as unknown[];

    // Only the parent's single factory invocation; no extra loads.
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
    expect(plugin[0]).toBe(plugin[1]);
    // No NEW vertex slots were registered under the consumer wire's genId.
    expect(env.rmInternal.vertexSlotsByGenId.has(99)).toBe(false);
  });

  it("map-mode: two map keys mapped to the same vertex namespace create two distinct slots", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    // Simulates `Plug({ a: "v/V", b: "v/V" }).useR()`.
    const plugin = (await env.rm.getPlugin({}, { a: "v/V", b: "v/V" }, undefined, () => {}, [], 42, undefined)) as {
      a: unknown;
      b: unknown;
    };

    // One shared blueprint load; two distinct slots → distinct instances.
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
    expect(plugin.a).not.toBe(plugin.b);
    // Tags come from the map keys (`"a"`, `"b"`), not numeric positions.
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["a", "b"])]]));
  });
});

describe("ResManager — stale resolve teardown", () => {
  it("emits resolveStale with reason 'generation' and teardownInvoked=true when generation bumps mid-flight", async () => {
    const bridge = makeTestBridge();
    const teardown = vi.fn();
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const env = createRmTestEnv({
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
    const inflight = env.rmInternal.getPod("g/X", undefined, 0, undefined, []);
    // Bump the generation while the factory is suspended. invalidate also
    // calls disposeSlot, but the slot's content is still a Promise at this
    // point — disposeSlot only removes the entry from the slots map, the
    // teardown will be invoked on the discarded pod at the stale-check
    // path in resolvePod.
    env.rm.invalidate("g/X");
    // Now release the factory — the resolve completes, builds the pod,
    // hits the stale check, and emits resolveStale.
    releaseGate();
    await inflight;

    expectEventSequence(collector.events, [
      "res:resolveStart",
      "res:invalidationStart",
      { type: "res:resolveStale", namespace: "g/X", reason: "generation", teardownInvoked: true },
    ]);
    // The discarded pod's Symbol.dispose was actually invoked.
    expect(teardown).toHaveBeenCalledOnce();
    // No slotCommitted event for this resolve — the pod was thrown away.
    expect(collector.events.some((e) => e.type === "res:slotCommitted")).toBe(false);

    collector.dispose();
  });

  it("emits resolveStale with reason 'slotIdentity' when the slot is dropped mid-flight without a generation bump", async () => {
    const bridge = makeTestBridge();
    const teardown = vi.fn();
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const env = createRmTestEnv({
      modules: {
        "g/X": async () => {
          await gate;
          return makeRawModule({ x: 1, [Symbol.dispose]: teardown });
        },
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    const inflight = env.rmInternal.getPod("g/X", undefined, 0, undefined, []);
    // Drop the slot directly from the protected map. No generation bump
    // happens, so the only stale-check trigger left is slot-identity
    // mismatch (slot's captured reference !== slots.get(key)).
    env.rmInternal.slots.delete(env.keyOf("g/X"));
    releaseGate();
    await inflight;

    expectEventSequence(collector.events, [
      "res:resolveStart",
      { type: "res:resolveStale", namespace: "g/X", reason: "slotIdentity", teardownInvoked: true },
    ]);
    expect(teardown).toHaveBeenCalledOnce();
    expect(collector.events.some((e) => e.type === "res:slotCommitted")).toBe(false);

    collector.dispose();
  });
});

describe("ResManager — invalidate cascade", () => {
  it("bumps generation, evicts the blueprint, and notifies subscribers", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });
    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);

    const callback = vi.fn();
    env.rm.subscribe(["g/X"], callback);

    env.rm.invalidate("g/X");

    expect(env.rmInternal.generationByNs.get("g/X")).toBe(1);
    expect(env.bmInternal.keysByNs.has("g/X")).toBe(false);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("disposes resolved slots in the closure (with Symbol.dispose invoked)", async () => {
    const teardown = vi.fn();
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1, [Symbol.dispose]: teardown }),
      },
    });
    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);

    env.rm.invalidate("g/X");

    expect(teardown).toHaveBeenCalledOnce();
    expect(env.rmInternal.slots.has(env.keyOf("g/X"))).toBe(false);
  });

  it("disposes slots in dispose-safe order (dependents before deps)", async () => {
    // Dep graph: g/A depends on g/B. Reverse closure of B = [A, B].
    // Dispose order must be [A, B] — A's teardown could reference B.
    const bridge = makeTestBridge();
    const teardownOrder: string[] = [];
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1, [Symbol.dispose]: () => teardownOrder.push("g/A") }),
        "g/B": () => makeRawModule({ b: 1, [Symbol.dispose]: () => teardownOrder.push("g/B") }),
      },
      busHost: bridge,
    });
    // Manually wire the dep graph: A → B.
    env.addDepEdge("g/A", "g/B");

    await env.rmInternal.getPod("g/A", undefined, 0, undefined, []);
    await env.rmInternal.getPod("g/B", undefined, 0, undefined, []);

    // Attach the collector only now so the buffer captures the invalidate
    // pass alone (no warm-up resolveStart/slotCommitted noise).
    const collector = collectEvents(bridge);

    env.rm.invalidate("g/B");

    expect(teardownOrder).toEqual(["g/A", "g/B"]);

    // Cross-check via the bus: res:slotDisposed events must mirror the
    // teardown order. Catches a future bug where teardown still runs but
    // the dispose event is forgotten / fired out of order.
    const disposedNs = collector.events.flatMap((e) => (e.type === "res:slotDisposed" ? [e.namespace] : []));
    expect(disposedNs).toEqual(["g/A", "g/B"]);

    collector.dispose();
  });

  it("notifies all subscribers of namespaces in the closure", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 1 }),
      },
    });
    env.addDepEdge("g/A", "g/B");

    const cbA = vi.fn();
    const cbB = vi.fn();
    env.rm.subscribe(["g/A"], cbA);
    env.rm.subscribe(["g/B"], cbB);

    env.rm.invalidate("g/B");

    // Both A (dependent of B) and B itself are in the closure.
    expect(cbA).toHaveBeenCalledOnce();
    expect(cbB).toHaveBeenCalledOnce();
  });

  it("does not notify subscribers outside the closure", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/Other": () => makeRawModule({ o: 1 }),
      },
    });

    const cbOther = vi.fn();
    env.rm.subscribe(["g/Other"], cbOther);

    env.rm.invalidate("g/A");

    expect(cbOther).not.toHaveBeenCalled();
  });

  it("emits blueprint:evicted before res:subscribersNotified for each namespace in the closure", async () => {
    // Invariant: any subscriber callback triggered by an invalidate must
    // see a FRESH BPM cache. The RM cascade enforces this by evicting all
    // blueprints in the closure (step 3) BEFORE firing the
    // subscribersNotified events (step 4). A regression where the loops
    // are interleaved would silently re-introduce stale-cache reads from
    // subscriber callbacks — undetectable without bus assertions.
    const bridge = makeTestBridge();
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 1 }),
      },
      busHost: bridge,
    });
    // Dep graph: A depends on B. Reverse closure of B = [A, B].
    env.addDepEdge("g/A", "g/B");
    await env.rmInternal.getPod("g/A", undefined, 0, undefined, []);
    await env.rmInternal.getPod("g/B", undefined, 0, undefined, []);

    // Two subscribers — one per namespace in the closure. Both must be
    // present so notifications actually fire (and the order assertion has
    // both endpoints to compare).
    env.rm.subscribe(["g/A"], () => {});
    env.rm.subscribe(["g/B"], () => {});

    const collector = collectEvents(bridge);

    env.rm.invalidate("g/B");

    // Per-namespace ordering: each ns's eviction precedes its notify.
    expectEventBefore(
      collector.events,
      { type: "blueprint:evicted", namespace: "g/A" },
      { type: "res:subscribersNotified", namespace: "g/A" }
    );
    expectEventBefore(
      collector.events,
      { type: "blueprint:evicted", namespace: "g/B" },
      { type: "res:subscribersNotified", namespace: "g/B" }
    );

    collector.dispose();
  });
});

describe("ResManager — subscribe", () => {
  it("returns a disposer that removes the callback", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    const cb = vi.fn();
    const dispose = env.rm.subscribe(["g/X"], cb);
    dispose();

    env.rm.invalidate("g/X");

    expect(cb).not.toHaveBeenCalled();
  });

  it("registers the same callback on multiple namespaces and unsubscribes from all on disposer", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 1 }),
      },
    });

    const cb = vi.fn();
    const dispose = env.rm.subscribe(["g/A", "g/B"], cb);

    env.rm.invalidate("g/A");
    expect(cb).toHaveBeenCalledTimes(1);

    dispose();
    env.rm.invalidate("g/B");
    // No additional call — the subscription was fully torn down.
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cleans up empty subscriber sets after the last unsubscribe", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });

    const dispose = env.rm.subscribe(["g/X"], () => {});
    expect(env.rmInternal.subscribersByNs.has("g/X")).toBe(true);

    dispose();

    expect(env.rmInternal.subscribersByNs.has("g/X")).toBe(false);
  });
});

describe("ResManager — HMR end-to-end via reloadModule", () => {
  it("HMR triggered through bm.reloadModule flows into invalidate", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/X": () => makeRawModule({ x: 1 }),
      },
    });
    await env.rmInternal.getPod("g/X", undefined, 0, undefined, []);
    expect(env.rmInternal.generationByNs.get("g/X") ?? 0).toBe(0);

    env.triggerHmr("g/X");

    expect(env.rmInternal.generationByNs.get("g/X")).toBe(1);
    expect(env.rmInternal.slots.has(env.keyOf("g/X"))).toBe(false);
  });

  it("locale-scoped reloadModule disposes only the matching shell slot", async () => {
    const env = createRmTestEnv({
      modules: {
        "s/Y": () => makeRawModule({ greeting: "hi" }),
      },
    });

    await env.rmInternal.getPod("s/Y", "en", 0, undefined, []);
    await env.rmInternal.getPod("s/Y", "it", 0, undefined, []);

    const enKey = env.keyOf("s/Y", "en");
    const itKey = env.keyOf("s/Y", "it");
    expect(env.rmInternal.slots.has(enKey)).toBe(true);
    expect(env.rmInternal.slots.has(itKey)).toBe(true);

    // HMR on the `en` shell file: only the `en` slot must be disposed.
    env.triggerHmr("s/Y", "en");

    expect(env.rmInternal.slots.has(enKey)).toBe(false);
    expect(env.rmInternal.slots.has(itKey)).toBe(true);
    // Generation is namespace-only — both locales now read stale on next get.
    expect(env.rmInternal.generationByNs.get("s/Y")).toBe(1);
  });
});

describe("ResManager — getPlugin kit partition", () => {
  it("partitions all kit entries as eager when chain is empty", async () => {
    const bridge = makeTestBridge();
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 1 }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    await env.rm.getPlugin({ a: "g/A", b: "g/B" }, [], undefined, () => {}, [], 0, undefined);

    const partition = collector.events.find((e) => e.type === "res:kitPartitioned");
    expect(partition).toMatchObject({
      type: "res:kitPartitioned",
      selfNamespace: undefined,
      eager: ["g/A", "g/B"],
      deferred: [],
    });

    collector.dispose();
  });

  it("partitions in-chain entries as deferred and the rest as eager", async () => {
    const bridge = makeTestBridge();
    const env = createRmTestEnv({
      modules: {
        // Only g/A needs to be loadable — g/B is deferred (in chain), and
        // the deferred-kit getter that RM installs for it is never invoked
        // in this test (no consumer reads $.kit.b).
        "g/A": () => makeRawModule({ a: 1 }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    await env.rm.getPlugin({ a: "g/A", b: "g/B" }, [], undefined, () => {}, ["g/B"], 0, undefined);

    const partition = collector.events.find((e) => e.type === "res:kitPartitioned");
    expect(partition).toMatchObject({
      type: "res:kitPartitioned",
      selfNamespace: "g/B",
      eager: ["g/A"],
      deferred: ["g/B"],
    });

    collector.dispose();
  });

  it("emits selfNamespace = chain[last] when the chain has multiple ancestors", async () => {
    const bridge = makeTestBridge();
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    await env.rm.getPlugin(
      { a: "g/A", b: "g/B", c: "g/C" },
      [],
      undefined,
      () => {},
      // g/B and g/C are both transitive ancestors. g/C is the innermost
      // (most recently entered) — its pod is what `chain[last]`
      // semantically identifies as "self" for kit purposes.
      ["g/B", "g/C"],
      0,
      undefined
    );

    const partition = collector.events.find((e) => e.type === "res:kitPartitioned");
    expect(partition).toMatchObject({
      type: "res:kitPartitioned",
      selfNamespace: "g/C",
      eager: ["g/A"],
      deferred: ["g/B", "g/C"],
    });

    collector.dispose();
  });
});

describe("ResManager — runtime cycle through kit", () => {
  it("kit-mate access during recursive resolve does not deadlock when the factory does not touch the cyclic kit entry", async () => {
    // b/A is a kit gear (in gearKit). b/B is a regular gear that A depends on.
    // Without the chain mechanism, B's factory's loadKit would await A's
    // pod (cached as Promise) → deadlock. With the chain, A is replaced
    // by a cyclic accessor in B's $.kit, and B's factory (which doesn't read
    // it) completes normally.
    const env = createRmTestEnv({
      gearKit: { a: "b/A" },
      modules: {
        "b/A": (rm) =>
          makeGearModule(rm, { a: "b/A" }, "base", ["b/B"], ([b]) => ({
            value: (b as { name: string }).name,
          })),
        "b/B": (rm) =>
          makeGearModule(rm, { a: "b/A" }, "base", [], () => ({
            name: "B",
          })),
      },
    });

    const result = await env.rmInternal.getPod("b/A", "en", 0, undefined, []);

    expect(result).toMatchObject({ res: { value: "B" } });
  });

  it("$.kit access on a cyclic ancestor throws ERR_CIRCULAR_DEPENDENCY with a clear message", async () => {
    // Same shape as above, but B's factory reads $.kit.a — which is a
    // cyclic-kit accessor at this point. The Proxy throws on the property
    // read; the error bubbles up through the RM's resolvePod chain.
    const env = createRmTestEnv({
      gearKit: { a: "b/A" },
      modules: {
        "b/A": (rm) =>
          makeGearModule(rm, { a: "b/A" }, "base", ["b/B"], ([b]) => ({
            value: (b as { name: string }).name,
          })),
        "b/B": (rm) =>
          makeGearModule(rm, { a: "b/A" }, "base", [], (plugin) => {
            // Plugin is [...deps, $]. Reach into $.kit.a — cyclic accessor.
            const $ = plugin[plugin.length - 1] as { kit: { a: { something: unknown } } };
            return { stolenFromA: $.kit.a.something };
          }),
      },
    });

    try {
      await env.rmInternal.getPod("b/A", "en", 0, undefined, []);
      expect.unreachable("expected getPod to throw a circular-kit error");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineResolveError);
      const e = error as RMachineResolveError;
      expect(e.code).toBe(ERR_CIRCULAR_DEPENDENCY);
      expect(e.message).toContain("b/A");
    }
  });

  it("emits res:deferredKitAccessed with ready=false on the cyclic accessor read", async () => {
    // Same setup as the previous test; here we observe the bus event that
    // fires inside the deferred-kit getter just before it throws. This is
    // the only place where `deferredKitAccessed { ready: false }` is
    // emitted — no state on the RM or BPM exposes this signal otherwise.
    const bridge = makeTestBridge();
    const env = createRmTestEnv({
      gearKit: { a: "b/A" },
      modules: {
        "b/A": (rm) =>
          makeGearModule(rm, { a: "b/A" }, "base", ["b/B"], ([b]) => ({
            value: (b as { name: string }).name,
          })),
        "b/B": (rm) =>
          makeGearModule(rm, { a: "b/A" }, "base", [], (plugin) => {
            const $ = plugin[plugin.length - 1] as { kit: { a: { something: unknown } } };
            return { stolenFromA: $.kit.a.something };
          }),
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    try {
      await env.rmInternal.getPod("b/A", "en", 0, undefined, []);
      expect.unreachable("expected getPod to throw a circular-kit error");
    } catch {
      // Expected — see previous test for the error-shape assertions.
    }

    // The accessor for b/A (the cyclic ancestor) fires exactly once, with
    // ready=false. The throw inside the getter follows synchronously, but
    // the event is emitted BEFORE the throw (see source comment in
    // pod-manager.ts:createDeferredKitGetter).
    const accessEvents = collector.events.filter((e) => e.type === "res:deferredKitAccessed");
    expect(accessEvents).toHaveLength(1);
    expect(accessEvents[0]).toMatchObject({
      type: "res:deferredKitAccessed",
      namespace: "b/A",
      ready: false,
    });

    collector.dispose();
  });
});

// End-user kit access: a real `shell/lib/fmt`-style formatter installed via
// `shellKit` and read from a factory plugin. Backs the documented `$.kit.fmt`
// guidance — the list form reaches the kit only through `$`, the map form also
// hoists it to the top level. See plug.test-d.ts for the type-level mirror.
describe("ResManager — $.kit.fmt end-user access", () => {
  // A formatter surface, as `shell/lib/fmt` (a shell kit entry) would expose.
  const fmtModule = () =>
    makeRawModule({
      number: (n: number) => `n:${n}`,
      currency: (n: number) => `$${n}`,
    });

  type FmtSurface = { number: (n: number) => string; currency: (n: number) => string };

  it("list form: the kit resolves under `$.kit.fmt` and is callable", async () => {
    const env = createRmTestEnv({
      shellKit: { fmt: "s/fmt" },
      modules: { "s/fmt": fmtModule },
    });

    // List-form deps (`[]`) → plugin is `[...deps, $]`, i.e. just `[$]`.
    const plugin = (await env.rm.getPlugin(
      { fmt: "s/fmt" },
      [],
      "en",
      () => {},
      [],
      0,
      undefined
    )) as readonly unknown[];
    const $ = plugin[plugin.length - 1] as { kit: { fmt: FmtSurface } };

    expect($.kit.fmt.number(42)).toBe("n:42");
    expect($.kit.fmt.currency(10)).toBe("$10");
  });

  it("list form: the kit is NOT hoisted onto `$` (must go through `$.kit`)", async () => {
    const env = createRmTestEnv({
      shellKit: { fmt: "s/fmt" },
      modules: { "s/fmt": fmtModule },
    });

    const plugin = (await env.rm.getPlugin(
      { fmt: "s/fmt" },
      [],
      "en",
      () => {},
      [],
      0,
      undefined
    )) as readonly unknown[];
    const $ = plugin[plugin.length - 1] as Record<string, unknown>;

    expect($.fmt).toBeUndefined();
    expect($).toHaveProperty("kit");
  });

  it("map form: the kit is hoisted to the top level AND reachable via `$.kit`", async () => {
    const env = createRmTestEnv({
      shellKit: { fmt: "s/fmt" },
      modules: { "s/fmt": fmtModule },
    });

    // Map-form deps (`{}`) → plugin is `{ ...kit, ...deps, $ }`.
    const plugin = (await env.rm.getPlugin({ fmt: "s/fmt" }, {}, "en", () => {}, [], 0, undefined)) as {
      fmt: FmtSurface;
      $: { kit: { fmt: FmtSurface } };
    };

    expect(plugin.fmt.number(7)).toBe("n:7");
    expect(plugin.$.kit.fmt.number(7)).toBe("n:7");
    // Same underlying surface, exposed two ways.
    expect(plugin.fmt).toBe(plugin.$.kit.fmt);
  });
});

// ─── Synchronous fast path (Tier A) ──────────────────────────────────────────
// `getPluginSync` assembles a plugin WITHOUT awaiting, by reading already-warm
// dependency slots. It returns the `ASYNC` sentinel the moment any pod is not
// synchronously available, so the wire falls back to the async `getPlugin`.

describe("ResManager — getPluginSync (Tier A: warm slots)", () => {
  it("returns the assembled plugin (not ASYNC) when every list dep is already warm", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 2 }),
      },
    });

    // Warm both dep slots via the async path.
    const asyncPlugin = (await env.rm.getPlugin(
      {},
      ["g/A", "g/B"],
      undefined,
      () => {},
      [],
      1,
      undefined
    )) as unknown[];

    const sync = env.rm.getPluginSync({}, ["g/A", "g/B"], undefined, () => {}, [], 1, undefined);

    expect(sync).not.toBe(ASYNC);
    const syncPlugin = sync as unknown[];
    // Same underlying surfaces (both read from the same warm slots).
    expect(syncPlugin[0]).toBe(asyncPlugin[0]);
    expect(syncPlugin[1]).toBe(asyncPlugin[1]);
    // List plugin shape: [...deps, $].
    expect(syncPlugin).toHaveLength(3);
    expect(syncPlugin[2]).toHaveProperty("kit");
  });

  it("returns the assembled plugin for map-form deps when warm", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
    });
    await env.rm.getPlugin({}, { a: "g/A" }, undefined, () => {}, [], 1, undefined);

    const sync = env.rm.getPluginSync({}, { a: "g/A" }, undefined, () => {}, [], 1, undefined);

    expect(sync).not.toBe(ASYNC);
    expect(sync).toHaveProperty("a");
    expect(sync).toHaveProperty("$");
  });

  it("resolves warm eager-kit entries synchronously too", async () => {
    const env = createRmTestEnv({
      gearKit: { a: "g/A" },
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 2 }),
      },
    });
    // Warm both the kit member (g/A) and the explicit dep (g/B).
    await env.rm.getPlugin({ a: "g/A" }, ["g/B"], undefined, () => {}, [], 1, undefined);

    const sync = env.rm.getPluginSync({ a: "g/A" }, ["g/B"], undefined, () => {}, [], 1, undefined);

    expect(sync).not.toBe(ASYNC);
    const $ = (sync as unknown[])[(sync as unknown[]).length - 1] as { kit: Record<string, unknown> };
    expect($.kit).toHaveProperty("a");
  });

  it("emits cacheHit but NOT resolveStart/factoryInvoked on a warm sync resolve", async () => {
    const bridge = makeTestBridge();
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
      busHost: bridge,
    });
    await env.rm.getPlugin({}, ["g/A"], undefined, () => {}, [], 1, undefined);

    // Observe only the sync-phase events.
    const collector = collectEvents(bridge);
    const sync = env.rm.getPluginSync({}, ["g/A"], undefined, () => {}, [], 1, undefined);
    expect(sync).not.toBe(ASYNC);

    const types = collector.events.map((e) => e.type);
    expect(types).toContain("res:cacheHit");
    expect(types).not.toContain("res:resolveStart");
    expect(types).not.toContain("res:factoryInvoked");
    collector.dispose();
  });

  it("does not load any module (no factory work) on the sync path", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
    });
    await env.rm.getPlugin({}, ["g/A"], undefined, () => {}, [], 1, undefined);
    const loadsBefore = env.loadCalls.length;

    env.rm.getPluginSync({}, ["g/A"], undefined, () => {}, [], 1, undefined);

    expect(env.loadCalls.length).toBe(loadsBefore);
  });
});

describe("ResManager — getPluginSync (declines → ASYNC)", () => {
  it("returns ASYNC for a cold dependency (slot never resolved)", () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
    });

    const sync = env.rm.getPluginSync({}, ["g/A"], undefined, () => {}, [], 1, undefined);

    expect(sync).toBe(ASYNC);
    // Crucially, declining must not have created a slot or loaded the module.
    expect(env.loadCalls).toHaveLength(0);
    expect(env.rmInternal.slots.has(env.keyOf("g/A"))).toBe(false);
  });

  it("returns ASYNC when a dep slot is still in-flight (Promise content)", async () => {
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const env = createRmTestEnv({
      modules: {
        "g/X": async () => {
          await gate;
          return makeRawModule({ x: 1 });
        },
      },
    });

    // Kick off the async resolve but do NOT await — the slot exists with a
    // Promise content.
    const pending = env.rm.getPlugin({}, ["g/X"], undefined, () => {}, [], 1, undefined);

    const sync = env.rm.getPluginSync({}, ["g/X"], undefined, () => {}, [], 1, undefined);
    expect(sync).toBe(ASYNC);

    releaseGate();
    await pending;
    // Now warm → sync succeeds.
    expect(env.rm.getPluginSync({}, ["g/X"], undefined, () => {}, [], 1, undefined)).not.toBe(ASYNC);
  });

  it("returns ASYNC after invalidation evicts the blueprint (real staleness path)", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
    });
    await env.rm.getPlugin({}, ["g/A"], undefined, () => {}, [], 1, undefined);
    expect(env.rm.getPluginSync({}, ["g/A"], undefined, () => {}, [], 1, undefined)).not.toBe(ASYNC);

    // A real HMR invalidation cascade bumps the generation, disposes the slot
    // AND evicts the blueprint — so the sync path has no cached blueprint to
    // re-create from and must defer to the async path (which re-imports).
    // (Generation only ever bumps via invalidate, which always evicts; a
    // generation bump WITHOUT eviction does not occur in production.)
    env.triggerHmr("g/A");

    expect(env.rm.getPluginSync({}, ["g/A"], undefined, () => {}, [], 1, undefined)).toBe(ASYNC);
  });
});

describe("ResManager — getPluginSync (vertex)", () => {
  it("creator cache hit: returns the same vertex surface as the warm async resolve", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });
    // Warm the creator slot under genId 42, occurrence "0".
    const asyncPlugin = (await env.rm.getPlugin({}, ["v/V"], undefined, () => {}, [], 42, undefined)) as unknown[];

    const sync = env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 42, undefined);

    expect(sync).not.toBe(ASYNC);
    expect((sync as unknown[])[0]).toBe(asyncPlugin[0]);
    // No second factory invocation.
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
  });

  it("covered path: shares the parent's slot synchronously", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });
    // Parent creates the vertex once.
    await env.rmInternal.getPod("v/V", undefined, 7, undefined, [], "0");
    const parentVKey = env.vKey(7, "0");

    const sync = env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 99, { "v/V": parentVKey });

    expect(sync).not.toBe(ASYNC);
    // No new vertex slot under the consumer genId.
    expect(env.rmInternal.vertexSlotsByGenId.has(99)).toBe(false);
    expect(env.loadCalls.filter((n) => n === "v/V").length).toBe(1);
  });

  it("covered path with a MISSING parent slot returns COVERED_PENDING (does not throw) — async path owns the error", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });
    const missingVKey = env.vKey(7, "0"); // never created

    // Sync returns COVERED_PENDING (NOT ASYNC): the wire must suspend + retry,
    // not fall through to the async path (which throws). See [[wire-manager.resolve]].
    expect(env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 99, { "v/V": missingVKey })).toBe(
      COVERED_PENDING
    );

    // The async path still throws the attributed vertex-not-found error.
    try {
      await env.rm.getPlugin({}, ["v/V"], undefined, () => {}, [], 99, { "v/V": missingVKey });
      expect.unreachable("expected getPlugin to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RMachineResolveError);
      expect((error as RMachineResolveError).code).toBe(ERR_VERTEX_INSTANCE_NOT_FOUND);
    }
  });

  it("getPodSync covered: returns the pod when the parent slot is fresh", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });
    await env.rmInternal.getPod("v/V", undefined, 7, undefined, [], "0");
    const parentVKey = env.vKey(7, "0");

    const pod = env.rmInternal.getPodSync("v/V", undefined, 99, { "v/V": parentVKey }, []);

    expect(pod).not.toBe(ASYNC);
    expect(pod).not.toBe(COVERED_PENDING);
    expect((pod as { surface: unknown }).surface).toBeDefined();
  });

  it("getPodSync covered: returns COVERED_PENDING (not ASYNC) when the parent slot is missing", () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });
    const missingVKey = env.vKey(7, "0"); // never created

    expect(env.rmInternal.getPodSync("v/V", undefined, 99, { "v/V": missingVKey }, [])).toBe(COVERED_PENDING);
  });

  it("getPodSync covered: returns COVERED_PENDING when the parent slot is stale (generation bumped)", async () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });
    await env.rmInternal.getPod("v/V", undefined, 7, undefined, [], "0");
    const parentVKey = env.vKey(7, "0");
    // Stale the parent slot the way invalidate() does (bump the namespace gen).
    env.rmInternal.generationByNs.set("v/V", (env.rmInternal.generationByNs.get("v/V") ?? 0) + 1);

    expect(env.rmInternal.getPodSync("v/V", undefined, 99, { "v/V": parentVKey }, [])).toBe(COVERED_PENDING);
  });

  it("creator MISS returns ASYNC without creating a slot or running the factory (Phase 1)", () => {
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });

    expect(env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 42, undefined)).toBe(ASYNC);
    expect(env.loadCalls).toHaveLength(0);
    expect(env.rmInternal.vertexSlotsByGenId.has(42)).toBe(false);
  });
});

// ─── Synchronous fast path (Tier B) ──────────────────────────────────────────
// `resolvePodSync` CREATES a pod synchronously when its blueprint is already
// cached AND (for factory resources) the matrix has proven sync-eligible on a
// prior async resolve. The key real-world trigger: a slot was disposed (e.g.
// vertex teardown) but its blueprint survived, and the same wire re-resolves.

describe("ResManager — getPluginSync (Tier B: sync creation)", () => {
  it("re-creates a RAW resource synchronously from a cached blueprint after its slot was disposed", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
    });
    // First async resolve caches the blueprint and creates the slot.
    await env.rm.getPlugin({}, ["g/A"], undefined, () => {}, [], 1, undefined);
    // Dispose ONLY the slot (mirrors a teardown); the blueprint survives.
    env.rmInternal.slots.delete(env.keyOf("g/A"));
    const loadsBefore = env.loadCalls.length;

    const sync = env.rm.getPluginSync({}, ["g/A"], undefined, () => {}, [], 1, undefined);

    expect(sync).not.toBe(ASYNC);
    // Re-created from the cached blueprint — no module re-load.
    expect(env.loadCalls.length).toBe(loadsBefore);
    // Slot re-committed.
    expect(env.rmInternal.slots.has(env.keyOf("g/A"))).toBe(true);
  });

  it("declines (ASYNC) for a RAW resource whose blueprint is NOT cached", () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
      },
    });
    // Never resolved → blueprint not cached.
    expect(env.rm.getPluginSync({}, ["g/A"], undefined, () => {}, [], 1, undefined)).toBe(ASYNC);
    expect(env.loadCalls).toHaveLength(0);
  });

  it("re-creates a sync-eligible VERTEX synchronously after its slot was disposed (factory runs in-sync)", async () => {
    let factoryRuns = 0;
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) =>
          makeSyncVertexModule(rm, {}, () => {
            factoryRuns++;
            return { v: factoryRuns };
          }),
      },
    });
    // First async resolve: proves the factory synchronous (eligible), caches the
    // blueprint, creates the slot + vertex index entry under genId 42 / tag "0".
    await env.rm.getPlugin({}, ["v/V"], undefined, () => {}, [], 42, undefined);
    expect(factoryRuns).toBe(1);
    // Dispose the vertex slot + index (blueprint survives).
    env.rm.disposeAllVertexSlotsByGenId(42);
    expect(env.rmInternal.vertexSlotsByGenId.has(42)).toBe(false);
    const loadsBefore = env.loadCalls.length;

    const sync = env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 42, undefined);

    expect(sync).not.toBe(ASYNC);
    // The factory re-ran synchronously (no module re-load).
    expect(factoryRuns).toBe(2);
    expect(env.loadCalls.length).toBe(loadsBefore);
    // Slot AND vertex index were re-registered (so disposal still finds it).
    expect(env.rmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(42, "0")))).toBe(true);
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["0"])]]));
  });

  it("declines (ASYNC) for a VERTEX whose factory is async (never sync-eligible)", async () => {
    const env = createRmTestEnv({
      modules: {
        // makeVertexModule uses an ASYNC userFactory → never eligible.
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }),
      },
    });
    await env.rm.getPlugin({}, ["v/V"], undefined, () => {}, [], 42, undefined);
    env.rm.disposeAllVertexSlotsByGenId(42);
    const loadsBefore = env.loadCalls.length;

    // Blueprint is cached, but the matrix never proved sync → decline.
    expect(env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 42, undefined)).toBe(ASYNC);
    // No speculative slot/index, no module re-load.
    expect(env.loadCalls.length).toBe(loadsBefore);
    expect(env.rmInternal.vertexSlotsByGenId.has(42)).toBe(false);
  });

  it("propagates a synchronous factory throw (so the wire falls back to the async path)", async () => {
    let shouldThrow = false;
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) =>
          makeSyncVertexModule(rm, {}, () => {
            if (shouldThrow) {
              throw new Error("boom");
            }
            return { v: 1 };
          }),
      },
    });
    // Warm: proves eligible, caches blueprint.
    await env.rm.getPlugin({}, ["v/V"], undefined, () => {}, [], 42, undefined);
    env.rm.disposeAllVertexSlotsByGenId(42);

    // Now make the sync factory throw — resolvePodSync must let it propagate.
    shouldThrow = true;
    try {
      env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 42, undefined);
      expect.unreachable("expected getPluginSync to throw");
    } catch (error) {
      expect((error as Error).message).toBe("boom");
    }
    // No slot/index left behind by the failed sync attempt.
    expect(env.rmInternal.vertexSlotsByGenId.has(42)).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(42, "0")))).toBe(false);
  });

  it("re-creates a sync-eligible vertex under a DIFFERENT genId after disposal (navigation scenario)", async () => {
    // This is the navigation case: leaving a view disposes the vertex slot, and
    // returning mounts a FRESH wire with a NEW genId. Because the blueprint is
    // keyed per-namespace (not per-genId), the new wire still finds it cached
    // and re-creates the pod synchronously — no Suspense flash on re-navigation.
    let runs = 0;
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) =>
          makeSyncVertexModule(rm, {}, () => {
            runs++;
            return { v: runs };
          }),
      },
    });
    // Wire A (genId 1) resolves async → caches the (ns-keyed) blueprint, proves
    // eligible, creates the slot.
    await env.rm.getPlugin({}, ["v/V"], undefined, () => {}, [], 1, undefined);
    expect(runs).toBe(1);
    // Navigate away: dispose wire A's vertex slot. The blueprint survives.
    env.rm.disposeAllVertexSlotsByGenId(1);
    const loadsBefore = env.loadCalls.length;

    // Navigate back: a brand-new wire (genId 2) resolves synchronously.
    const sync = env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 2, undefined);

    expect(sync).not.toBe(ASYNC);
    expect(runs).toBe(2); // factory re-ran synchronously
    expect(env.loadCalls.length).toBe(loadsBefore); // blueprint shared — no module re-load
    // A fresh slot + index entry under the NEW genId.
    expect(env.rmInternal.slots.has(env.keyOf("v/V", undefined, env.vKey(2, "0")))).toBe(true);
    expect(env.rmInternal.vertexSlotsByGenId.get(2)).toEqual(new Map([["v/V", new Set(["0"])]]));
  });
});

// ─── Coverage completion (Core-6) ────────────────────────────────────────────
// Targeted tests for the orchestrator's remaining edges: the scope-provider
// accessor, the synchronous plugin decline/partition paths, the deferred-kit
// success path, the request-scope vertex routing/teardown, and the defensive
// error-handling guards. res-manager.ts was not part of any earlier Core
// sub-task; this section drives it to 100%.

describe("ResManager — scope provider accessor", () => {
  it("getScopeProvider returns the installed provider (defaults to PROCESS_SCOPE_PROVIDER)", () => {
    const env = createRmTestEnv({ modules: {} });
    expect(env.rm.getScopeProvider()).toBe(PROCESS_SCOPE_PROVIDER);

    const provider: RequestScopeProvider = { getActiveScope: () => null };
    env.rm.setScopeProvider(provider);
    expect(env.rm.getScopeProvider()).toBe(provider);
  });
});

describe("getResCacheKey — vertex key fallback", () => {
  it("uses an empty vertexKey suffix when none is supplied", () => {
    expect(getResCacheKey("v/V" as AnyNamespace, undefined, "gear:outer(vertex)")).toBe("V:v/V\x1f");
  });
});

describe("ResManager — getPluginSync decline & partition paths", () => {
  it("installs a deferred (in-chain) kit entry without resolving it eagerly", () => {
    const env = createRmTestEnv({ modules: { "g/SELF": () => makeRawModule({ s: 1 }) } });

    // g/SELF is in the chain → deferred. No eager kit, no deps → sync succeeds
    // and the deferred entry is installed lazily (NOT resolved here).
    const sync = env.rm.getPluginSync({ self: "g/SELF" }, [], undefined, () => {}, ["g/SELF"], 1, undefined);

    expect(sync).not.toBe(ASYNC);
    const $ = (sync as unknown[])[0] as { kit: Record<string, unknown> };
    expect($).toHaveProperty("kit");
    expect(env.loadCalls).toHaveLength(0);
  });

  it("declines (ASYNC) when an eager kit entry is cold", () => {
    const env = createRmTestEnv({ modules: { "g/A": () => makeRawModule({ a: 1 }) } });

    expect(env.rm.getPluginSync({ a: "g/A" }, [], undefined, () => {}, [], 1, undefined)).toBe(ASYNC);
  });

  it("declines (ASYNC) when a map dep is cold", () => {
    const env = createRmTestEnv({ modules: { "g/A": () => makeRawModule({ a: 1 }) } });

    expect(env.rm.getPluginSync({}, { a: "g/A" }, undefined, () => {}, [], 1, undefined)).toBe(ASYNC);
  });

  it("returns COVERED_PENDING when a MAP dep is a covered vertex with a missing parent", () => {
    const env = createRmTestEnv({ modules: { "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }) } });
    const missingVKey = env.vKey(7, "0"); // never created

    expect(env.rm.getPluginSync({}, { v: "v/V" }, undefined, () => {}, [], 99, { "v/V": missingVKey })).toBe(
      COVERED_PENDING
    );
  });

  it("emits kitPartitioned (eager + deferred) once the whole graph resolves synchronously", async () => {
    const bridge = makeTestBridge();
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/SELF": () => makeRawModule({ s: 1 }),
      },
      busHost: bridge,
    });
    // Warm the eager kit member so the sync path can read it from a warm slot.
    await env.rm.getPlugin({ a: "g/A" }, [], undefined, () => {}, [], 1, undefined);

    const collector = collectEvents(bridge);
    // g/A eager (warm); g/SELF in chain → deferred. Sync succeeds → emits.
    const sync = env.rm.getPluginSync({ a: "g/A", self: "g/SELF" }, [], undefined, () => {}, ["g/SELF"], 1, undefined);
    expect(sync).not.toBe(ASYNC);

    const partition = collector.events.find((e) => e.type === "res:kitPartitioned");
    expect(partition).toMatchObject({ eager: ["g/A"], deferred: ["g/SELF"] });

    collector.dispose();
  });
});

describe("ResManager — deferred kit getter (success path)", () => {
  it("resolves a deferred self-kit entry once its ancestor slot has committed", async () => {
    const bridge = makeTestBridge();
    let captured: { kit: Record<string, unknown> } | undefined;
    const env = createRmTestEnv({
      gearKit: { self: "b/A" },
      modules: {
        "b/A": (rm) =>
          makeGearModule(rm, { self: "b/A" }, "base", [], (plugin) => {
            captured = plugin[plugin.length - 1] as { kit: Record<string, unknown> };
            return { name: "A" };
          }),
      },
      busHost: bridge,
    });

    await env.rmInternal.getPod("b/A", "en", 0, undefined, []);
    const collector = collectEvents(bridge);

    // The slot is now committed → the deferred accessor returns b/A's surface.
    const selfSurface = captured?.kit.self as { name: string };
    expect(selfSurface.name).toBe("A");

    expect(collector.events).toContainEqual(
      expect.objectContaining({ type: "res:deferredKitAccessed", namespace: "b/A", ready: true })
    );
    collector.dispose();
  });
});

describe("ResManager — invalidate edges", () => {
  it("skips slots whose namespace is outside the invalidation closure", async () => {
    const env = createRmTestEnv({
      modules: {
        "g/A": () => makeRawModule({ a: 1 }),
        "g/B": () => makeRawModule({ b: 2 }),
      },
    });
    await env.rmInternal.getPod("g/A", "en", 0, undefined, []);
    await env.rmInternal.getPod("g/B", "en", 0, undefined, []);

    // No dep edges → closure of g/A is {g/A}. g/B's slot must survive the walk.
    env.rm.invalidate("g/A");

    expect(env.rmInternal.slots.has(env.keyOf("g/A", "en"))).toBe(false);
    expect(env.rmInternal.slots.has(env.keyOf("g/B", "en"))).toBe(true);
  });

  it("swallows a throwing subscriber callback and still notifies the rest", async () => {
    const env = createRmTestEnv({ modules: { "g/A": () => makeRawModule({ a: 1 }) } });
    await env.rmInternal.getPod("g/A", "en", 0, undefined, []);

    const good = vi.fn();
    env.rm.subscribe(["g/A"], () => {
      throw new Error("subscriber boom");
    });
    env.rm.subscribe(["g/A"], good);

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => env.rm.invalidate("g/A")).not.toThrow();
      expect(good).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("swallows a throwing teardown on a discarded (stale) pod", async () => {
    const teardown = vi.fn(() => {
      throw new Error("teardown boom");
    });
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const env = createRmTestEnv({
      modules: {
        "g/X": async () => {
          await gate;
          return makeRawModule({ x: 1, [Symbol.dispose]: teardown });
        },
      },
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const inflight = env.rmInternal.getPod("g/X", undefined, 0, undefined, []);
      env.rm.invalidate("g/X"); // bump generation → the resolved pod is stale
      releaseGate();
      await inflight;

      expect(teardown).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalled(); // the teardown throw was caught + logged
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("ResManager — vertex dispose guards", () => {
  it("disposeSlot is a no-op for a non-existent key", () => {
    const env = createRmTestEnv({ modules: {} });
    const disposeSlot = (env.rm as unknown as { disposeSlot(k: string): void }).disposeSlot.bind(env.rm);
    expect(() => disposeSlot("nonexistent-key")).not.toThrow();
  });

  it("disposeVertexSlotsForNamespace is a no-op for an unknown genId (no index entry)", () => {
    const env = createRmTestEnv({ modules: {} });
    expect(() => env.rm.disposeVertexSlotsForNamespace("v/Nope" as AnyNamespace, 999)).not.toThrow();
  });

  it("disposeVertexSlotsForNamespace is a no-op for a known genId but unknown namespace", async () => {
    const env = createRmTestEnv({ modules: { "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }) } });
    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");

    // genId 42 exists in the index (byNs present) but "v/Other" has no tag set.
    expect(() => env.rm.disposeVertexSlotsForNamespace("v/Other" as AnyNamespace, 42)).not.toThrow();
    // The real slot is untouched.
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["0"])]]));
  });

  it("disposeVertexSlotsByOwnershipChange is a no-op for an unknown genId", () => {
    const env = createRmTestEnv({ modules: {} });
    expect(() =>
      env.rm.disposeVertexSlotsByOwnershipChange(999, { "v/X": "key" } as Record<AnyNamespace, string>)
    ).not.toThrow();
  });
});

describe("ResManager — request-scope vertex routing & teardown", () => {
  it("routes vertex slots + index into the active scope, then disposeRequestScope tears them down", async () => {
    const env = createRmTestEnv({ modules: { "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }) } });
    const scope = createRequestScope();
    env.rm.setScopeProvider({ getActiveScope: () => scope });

    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");

    // Routed to the scope's vertex tier — NOT the process-tier maps.
    expect(scope.vertexSlots.size).toBe(1);
    expect(scope.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["0"])]]));
    expect(env.rmInternal.slots.size).toBe(0);
    expect(env.rmInternal.vertexSlotsByGenId.size).toBe(0);

    env.rm.disposeRequestScope(scope);

    expect(scope.vertexSlots.size).toBe(0);
    expect(scope.vertexSlotsByGenId.size).toBe(0);
  });

  it("disposeRequestScope skips a closure namespace that has no slot in the scope", async () => {
    const env = createRmTestEnv({ modules: { "v/B": (rm) => makeVertexModule(rm, {}, { b: 1 }) } });
    const scope = createRequestScope();
    env.rm.setScopeProvider({ getActiveScope: () => scope });

    await env.rmInternal.getPod("v/B", undefined, 42, undefined, [], "0");

    // v/A depends on v/B → reverseClosure(v/B) includes v/A, but v/A was never
    // resolved in this scope (no slot) → the dispose walk skips it.
    env.addDepEdge("v/A", "v/B");

    expect(() => env.rm.disposeRequestScope(scope)).not.toThrow();
    expect(scope.vertexSlots.size).toBe(0);
  });

  it("logs and continues when disposing a scope slot whose resource uses async dispose", async () => {
    // A resource with [Symbol.asyncDispose] makes tryGetDispose throw inside
    // disposeSlotIn (async dispose is unsupported) — disposeRequestScope must
    // catch + log per slot rather than abort.
    const env = createRmTestEnv({
      modules: {
        "v/V": (rm) => makeVertexModule(rm, {}, { v: 1, [Symbol.asyncDispose]: () => Promise.resolve() } as never),
      },
    });
    const scope = createRequestScope();
    env.rm.setScopeProvider({ getActiveScope: () => scope });

    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => env.rm.disposeRequestScope(scope)).not.toThrow();
      expect(errorSpy).toHaveBeenCalledWith("[r-machine] disposeRequestScope error for", "v/V", expect.anything());
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("buckets multiple slots of one namespace (duplicate vertex occurrences) in a scope", async () => {
    const env = createRmTestEnv({ modules: { "v/V": (rm) => makeVertexModule(rm, {}, { v: 1 }) } });
    const scope = createRequestScope();
    env.rm.setScopeProvider({ getActiveScope: () => scope });

    // Two occurrence tags → two slots under the SAME namespace in the scope.
    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "0");
    await env.rmInternal.getPod("v/V", undefined, 42, undefined, [], "1");
    expect(scope.vertexSlots.size).toBe(2);

    env.rm.disposeRequestScope(scope);
    expect(scope.vertexSlots.size).toBe(0);
  });
});

describe("ResManager — guard branch completion", () => {
  it("a stale pod with no Symbol.dispose reports teardownInvoked=false", async () => {
    const bridge = makeTestBridge();
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const env = createRmTestEnv({
      modules: {
        "g/X": async () => {
          await gate;
          return makeRawModule({ x: 1 }); // NO Symbol.dispose
        },
      },
      busHost: bridge,
    });
    const collector = collectEvents(bridge);

    const inflight = env.rmInternal.getPod("g/X", undefined, 0, undefined, []);
    env.rm.invalidate("g/X"); // bump generation → pod is stale on completion
    releaseGate();
    await inflight;

    expect(collector.events).toContainEqual(
      expect.objectContaining({ type: "res:resolveStale", namespace: "g/X", teardownInvoked: false })
    );
    collector.dispose();
  });

  it("error cleanup leaves the slot map alone when the slot was already replaced", async () => {
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const env = createRmTestEnv({
      modules: {
        "g/X": async () => {
          await gate;
          throw new Error("factory boom");
        },
      },
    });

    const inflight = env.rmInternal.getPod("g/X", undefined, 0, undefined, []);
    // Drop the in-flight slot before the factory errors → on the error path the
    // identity check `slotsMap.get(key) === slot` is false, so no delete runs.
    env.rmInternal.slots.delete(env.keyOf("g/X"));
    releaseGate();

    await expect(inflight).rejects.toThrow("factory boom");
  });

  it("a deferred kit key shadowed by a same-named dep is not hoisted to the plugin top level", async () => {
    const env = createRmTestEnv({
      gearKit: { x: "g/SELF" },
      modules: {
        "g/X": () => makeRawModule({ from: "dep" }),
        "g/SELF": () => makeRawModule({ from: "kit" }),
      },
    });

    // kit x→g/SELF is in the chain (deferred); dep x→g/X is eager. The dep
    // shadows the kit key at top level, so the deferred getter is installed on
    // `$.kit` only (the `!(k in deps)` guard is false).
    const plugin = (await env.rm.getPlugin(
      { x: "g/SELF" },
      { x: "g/X" },
      "en",
      () => {},
      ["g/SELF"],
      0,
      undefined
    )) as { x: { from: string } };

    expect(plugin.x.from).toBe("dep");
  });

  it("Tier-B sync re-create reuses an existing vertex index entry (byNs/tags present)", async () => {
    const env = createRmTestEnv({
      modules: { "v/V": (rm) => makeSyncVertexModule(rm, {}, () => ({ v: 1 })) },
    });
    // Async resolve registers the index {42:{v/V:{"0"}}} and proves sync-eligible.
    await env.rm.getPlugin({}, ["v/V"], undefined, () => {}, [], 42, undefined);
    // Drop ONLY the slot, keeping the index entry alive.
    env.rmInternal.slots.delete(env.keyOf("v/V", undefined, env.vKey(42, "0")));

    // Tier-B sync re-create: the index byNs map AND its tag set already exist.
    const sync = env.rm.getPluginSync({}, ["v/V"], undefined, () => {}, [], 42, undefined);

    expect(sync).not.toBe(ASYNC);
    expect(env.rmInternal.vertexSlotsByGenId.get(42)).toEqual(new Map([["v/V", new Set(["0"])]]));
  });

  it("disposeResources groups multiple slots of one namespace (shell at two locales)", async () => {
    const env = createRmTestEnv({ modules: { "s/Z": () => makeRawModule({ z: 1 }) } });
    await env.rmInternal.getPod("s/Z", "en", 0, undefined, []);
    await env.rmInternal.getPod("s/Z", "it", 0, undefined, []);
    expect(env.rmInternal.slots.size).toBe(2);

    env.rm.disposeResources();
    expect(env.rmInternal.slots.size).toBe(0);
  });

  it("invalidate groups multiple slots of one namespace in the closure (shell at two locales)", async () => {
    const env = createRmTestEnv({ modules: { "s/Z": () => makeRawModule({ z: 1 }) } });
    await env.rmInternal.getPod("s/Z", "en", 0, undefined, []);
    await env.rmInternal.getPod("s/Z", "it", 0, undefined, []);

    // No locale → both shell slots are in the closure and grouped together.
    env.rm.invalidate("s/Z");
    expect(env.rmInternal.slots.size).toBe(0);
  });
});
