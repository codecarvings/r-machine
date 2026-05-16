import { describe, expect, it } from "vitest";
import { BlueprintManager } from "../../src/core/blueprint-manager.js";
import type { BusHost } from "../../src/core/event-bus.js";
import { getJunctureResCacheKey, JunctureManager } from "../../src/core/juncture-manager.js";
import { managed } from "../../src/core/managed.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResEquipment } from "../../src/core/res-equipment.js";
import { type AnyResLayout, ResLayoutResolver } from "../../src/core/res-layout.js";
import type { AnyNamespaceMap } from "../../src/core/res-map.js";
import { createResMatrix } from "../../src/core/res-matrix.js";
import type { AnyResModule, ResModuleLoaderFnOptions } from "../../src/core/res-module.js";
import {
  createRequestScope,
  PROCESS_SCOPE_PROVIDER,
  type RequestScope,
  type RequestScopeProvider,
} from "../../src/core/scope.js";

// Layout: g/* inner (raw), b/* base (raw), s/* shell (raw),
// o/* outer (matrix — exercise factory path + managed teardown).
const TEST_LAYOUT: AnyResLayout = {
  "g/": "gear:inner",
  "b/": "gear:base",
  "s/": "shell",
  "o/": "gear:outer",
};

// Build an outer-gear matrix module whose factory returns a `managed` resource
// — the teardown callback is recorded so tests can assert call order.
function makeOuterModule(
  jm: () => JunctureManager,
  kit: AnyNamespaceMap,
  deps: readonly AnyNamespace[],
  resource: AnyRes,
  teardown: () => void
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
      const plugin = await jm().getPlugin(kit, nsDeps, locale, augmentCtx, chain, 0, undefined);
      return { plugin };
    },
  };
  const matrix = createResMatrix({
    connector,
    meta: { family: "gear", role: "outer" },
    head: head as never,
    cursor: undefined,
    userFactory: async () => managed(resource, teardown),
  });
  return { r: matrix };
}

interface ProviderHandle {
  provider: RequestScopeProvider;
  setScope(s: RequestScope | null): void;
}

function makeMutableProvider(): ProviderHandle {
  let active: RequestScope | null = null;
  return {
    provider: { getActiveScope: () => active },
    setScope: (s) => {
      active = s;
    },
  };
}

interface EnvOptions {
  readonly modules: Record<string, (jm: () => JunctureManager) => AnyResModule>;
  readonly priority?: AnyNamespace[];
  readonly addEdges?: ReadonlyArray<readonly [AnyNamespace, AnyNamespace]>;
}

function createEnv(options: EnvOptions) {
  let jm!: JunctureManager;

  const loader = async (_path: string, opts?: ResModuleLoaderFnOptions): Promise<AnyResModule> => {
    if (!opts) throw new Error("expected options");
    const factory = options.modules[opts.namespace];
    if (!factory) throw new Error(`No module for ${opts.namespace}`);
    return factory(() => jm);
  };

  const resolver = new ResLayoutResolver(TEST_LAYOUT);
  const equipment: AnyResEquipment = {
    gearKit: {},
    shellKit: {},
    bridgeGears: [],
  };
  const busHost: BusHost = { bus: undefined };
  const bm = new BlueprintManager(resolver, loader, { gear: [], shell: [] }, options.priority ?? [], busHost);
  jm = new JunctureManager(resolver, equipment, bm, busHost);

  const bmInternal = bm as unknown as {
    forwardDeps: Map<AnyNamespace, Set<AnyNamespace>>;
    reverseDeps: Map<AnyNamespace, Set<AnyNamespace>>;
  };
  for (const [from, to] of options.addEdges ?? []) {
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
  }

  const jmInternal = jm as unknown as {
    slots: Map<string, unknown>;
    getJuncture(
      namespace: AnyNamespace,
      locale: string | undefined,
      genId: number,
      vertexGearMap: Record<AnyNamespace, number> | undefined,
      chain: readonly AnyNamespace[]
    ): Promise<unknown>;
  };

  return {
    jm,
    jmInternal,
    keyOf: (ns: string, locale?: string) => getJunctureResCacheKey(ns, locale, resolver.resolveLayoutEntryType(ns)),
  };
}

describe("JunctureManager — request scope routing", () => {
  it("routes Outer slot resolution to the active scope's outerSlots map (not the process slots)", async () => {
    const env = createEnv({
      modules: {
        "o/A": (jm) => makeOuterModule(jm, {}, [], { a: 1 }, () => {}),
      },
    });
    const handle = makeMutableProvider();
    env.jm.setScopeProvider(handle.provider);
    const scope = createRequestScope();
    handle.setScope(scope);

    await env.jmInternal.getJuncture("o/A", undefined, 0, undefined, []);

    expect(scope.outerSlots.has(env.keyOf("o/A"))).toBe(true);
    expect(env.jmInternal.slots.has(env.keyOf("o/A"))).toBe(false);
  });

  it("falls back to the process slots when no scope is active (default provider)", async () => {
    const env = createEnv({
      modules: {
        "o/A": (jm) => makeOuterModule(jm, {}, [], { a: 1 }, () => {}),
      },
    });
    env.jm.setScopeProvider(PROCESS_SCOPE_PROVIDER);

    await env.jmInternal.getJuncture("o/A", undefined, 0, undefined, []);

    expect(env.jmInternal.slots.has(env.keyOf("o/A"))).toBe(true);
  });

  it("keeps Inner/Base/Shell slots in the process tier regardless of scope state", async () => {
    const env = createEnv({
      modules: {
        "g/X": () => ({ r: { v: 1 } }),
        "b/Y": () => ({ r: { v: 2 } }),
        "s/Z": () => ({ r: { v: 3 } }),
      },
    });
    const handle = makeMutableProvider();
    env.jm.setScopeProvider(handle.provider);
    const scope = createRequestScope();
    handle.setScope(scope);

    await env.jmInternal.getJuncture("g/X", undefined, 0, undefined, []);
    await env.jmInternal.getJuncture("b/Y", undefined, 0, undefined, []);
    await env.jmInternal.getJuncture("s/Z", "en", 0, undefined, []);

    expect(env.jmInternal.slots.has(env.keyOf("g/X"))).toBe(true);
    expect(env.jmInternal.slots.has(env.keyOf("b/Y"))).toBe(true);
    expect(env.jmInternal.slots.has(env.keyOf("s/Z", "en"))).toBe(true);
    expect(scope.outerSlots.size).toBe(0);
  });
});

describe("JunctureManager — disposeRequestScope", () => {
  it("invokes managed teardowns for all Outer slots created in the scope", async () => {
    const teardownOrder: string[] = [];
    const env = createEnv({
      modules: {
        "o/A": (jm) => makeOuterModule(jm, {}, [], { v: "a" }, () => teardownOrder.push("o/A")),
        "o/B": (jm) => makeOuterModule(jm, {}, [], { v: "b" }, () => teardownOrder.push("o/B")),
      },
    });
    const handle = makeMutableProvider();
    env.jm.setScopeProvider(handle.provider);
    const scope = createRequestScope();
    handle.setScope(scope);

    await env.jmInternal.getJuncture("o/A", undefined, 0, undefined, []);
    await env.jmInternal.getJuncture("o/B", undefined, 0, undefined, []);
    expect(scope.outerSlots.size).toBe(2);

    env.jm.disposeRequestScope(scope);

    expect(teardownOrder.sort()).toEqual(["o/A", "o/B"]);
    expect(scope.outerSlots.size).toBe(0);
  });

  it("disposes dependents before their dependencies (reverse-topological order)", async () => {
    // Chain: o/A depends on o/B depends on o/C. Dispose order must be A, B, C.
    const teardownOrder: string[] = [];
    const env = createEnv({
      modules: {
        "o/A": (jm) => makeOuterModule(jm, {}, ["o/B"], { v: "a" }, () => teardownOrder.push("o/A")),
        "o/B": (jm) => makeOuterModule(jm, {}, ["o/C"], { v: "b" }, () => teardownOrder.push("o/B")),
        "o/C": (jm) => makeOuterModule(jm, {}, [], { v: "c" }, () => teardownOrder.push("o/C")),
      },
      addEdges: [
        ["o/A", "o/B"],
        ["o/B", "o/C"],
      ],
    });
    const handle = makeMutableProvider();
    env.jm.setScopeProvider(handle.provider);
    const scope = createRequestScope();
    handle.setScope(scope);

    // Resolve from the top: A pulls B pulls C through the matrix connector.
    await env.jmInternal.getJuncture("o/A", undefined, 0, undefined, []);
    expect(scope.outerSlots.size).toBe(3);

    env.jm.disposeRequestScope(scope);

    expect(teardownOrder).toEqual(["o/A", "o/B", "o/C"]);
    expect(scope.outerSlots.size).toBe(0);
  });

  it("continues disposing remaining slots when a teardown throws", async () => {
    const teardownOrder: string[] = [];
    const env = createEnv({
      modules: {
        "o/A": (jm) =>
          makeOuterModule(jm, {}, [], { v: "a" }, () => {
            teardownOrder.push("o/A");
            throw new Error("boom");
          }),
        "o/B": (jm) => makeOuterModule(jm, {}, [], { v: "b" }, () => teardownOrder.push("o/B")),
      },
    });
    const handle = makeMutableProvider();
    env.jm.setScopeProvider(handle.provider);
    const scope = createRequestScope();
    handle.setScope(scope);

    await env.jmInternal.getJuncture("o/A", undefined, 0, undefined, []);
    await env.jmInternal.getJuncture("o/B", undefined, 0, undefined, []);

    // disposeRequestScope must not throw even if one teardown does.
    expect(() => env.jm.disposeRequestScope(scope)).not.toThrow();
    expect(teardownOrder.sort()).toEqual(["o/A", "o/B"]);
    expect(scope.outerSlots.size).toBe(0);
  });

  it("is a no-op when the scope is empty", () => {
    const env = createEnv({ modules: {} });
    const scope = createRequestScope();
    expect(() => env.jm.disposeRequestScope(scope)).not.toThrow();
    expect(scope.outerSlots.size).toBe(0);
  });
});

describe("JunctureManager — scope isolation across requests", () => {
  it("two scopes resolving the same Outer namespace get independent slot instances, each disposed cleanly", async () => {
    let teardownCalls = 0;
    const env = createEnv({
      modules: {
        "o/A": (jm) => makeOuterModule(jm, {}, [], { v: 1 }, () => teardownCalls++),
      },
    });
    const handle = makeMutableProvider();
    env.jm.setScopeProvider(handle.provider);

    const scopeA = createRequestScope();
    handle.setScope(scopeA);
    await env.jmInternal.getJuncture("o/A", undefined, 0, undefined, []);
    const slotInA = scopeA.outerSlots.get(env.keyOf("o/A"));
    expect(slotInA).toBeDefined();
    env.jm.disposeRequestScope(scopeA);
    expect(teardownCalls).toBe(1);
    expect(scopeA.outerSlots.size).toBe(0);

    const scopeB = createRequestScope();
    handle.setScope(scopeB);
    await env.jmInternal.getJuncture("o/A", undefined, 0, undefined, []);
    const slotInB = scopeB.outerSlots.get(env.keyOf("o/A"));
    expect(slotInB).toBeDefined();
    // Slot instance is freshly created in scope B — not the disposed one from A.
    expect(slotInB).not.toBe(slotInA);
    env.jm.disposeRequestScope(scopeB);
    expect(teardownCalls).toBe(2);

    // Process tier is empty throughout: outer slots never landed in it.
    expect(env.jmInternal.slots.has(env.keyOf("o/A"))).toBe(false);
  });
});
