import { describe, expect, it } from "vitest";
import { BlueprintManager, getBlueprintResCacheKey } from "../../src/core/blueprint-manager.js";
import type { GearRole } from "../../src/core/gear-plug.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import { type AnyResLayout, ResLayoutResolver } from "../../src/core/res-layout.js";
import { createResMatrix } from "../../src/core/res-matrix.js";
import type { AnyResModule, ResModuleLoaderFnOptions } from "../../src/core/res-module.js";

// --- helpers -----------------------------------------------------------------

// Build a minimal "matrix" module whose only test-relevant property is
// plugHead.nsDepList (the dep list the BM extracts to populate forwardDeps).
// connector / userFactory / cursor are never invoked by BM (they are exercised
// by JM's resolveJuncture, which is not under test here).
function makeMatrixModule(family: "gear" | "shell", role: GearRole | undefined, deps: string[]): AnyResModule {
  const head = {
    realm: "res",
    family,
    mode: "list",
    deps,
    nsDeps: deps,
    nsDepList: deps,
    ports: {},
  };
  const meta = family === "gear" ? { family, role: role as GearRole } : { family };
  // Test-only fakes: connector / meta / head are typed strictly in the
  // signature but BM only reads the matrix shape (symbol + plug.head.nsDepList).
  const matrix = createResMatrix({
    connector: { getWire: async () => ({ plugin: undefined }) } as never,
    meta: meta as never,
    head: head as never,
    cursor: undefined,
    userFactory: async () => ({}),
  });
  return { r: matrix };
}

function makeRawModule(resource: unknown = {}): AnyResModule {
  return { r: resource as never };
}

// Layout used by all tests.
const TEST_LAYOUT: AnyResLayout = {
  "g/": "gear:inner",
  "s/": "shell",
  "v/": "gear:outer(vertex)",
};

interface TestEnvOptions {
  readonly modules: Record<string, () => AnyResModule | Promise<AnyResModule>>;
  readonly kitDeps?: { gear?: string[]; shell?: string[] };
  readonly priority?: string[];
}

function createTestEnv(options: TestEnvOptions) {
  const loadCalls: string[] = [];

  const loader = async (_path: string, opts?: ResModuleLoaderFnOptions): Promise<AnyResModule> => {
    if (!opts) {
      throw new Error("expected ResModuleLoaderFnOptions");
    }
    loadCalls.push(opts.namespace);
    const factory = options.modules[opts.namespace];
    if (!factory) {
      throw new Error(`No module registered for "${opts.namespace}"`);
    }
    return factory();
  };

  const resolver = new ResLayoutResolver(TEST_LAYOUT);
  const bm = new BlueprintManager(
    resolver,
    loader,
    {
      gear: options.kitDeps?.gear ?? [],
      shell: options.kitDeps?.shell ?? [],
    },
    options.priority ?? [],
    { bus: undefined }
  );

  return {
    bm,
    triggerHmr: (ns: string, locale?: string) => {
      const layoutType = resolver.resolveLayoutEntryType(ns as AnyNamespace);
      const path = resolver.resolvePath(ns as AnyNamespace, locale, layoutType);
      bm.reloadModule(path);
    },
    loadCalls,
    keyOf: (ns: string, locale?: string) => getBlueprintResCacheKey(ns, locale, resolver.resolveLayoutEntryType(ns)),
    inspect: () =>
      bm as unknown as {
        forwardDeps: Map<AnyNamespace, Set<AnyNamespace>>;
        reverseDeps: Map<AnyNamespace, Set<AnyNamespace>>;
        keysByNs: Map<AnyNamespace, Set<string>>;
        cache: Map<string, unknown>;
      },
  };
}

async function loadByNs(env: ReturnType<typeof createTestEnv>, ns: string, locale?: string): Promise<unknown> {
  const layoutType = new ResLayoutResolver(TEST_LAYOUT).resolveLayoutEntryType(ns);
  return env.bm.getBlueprint(ns, locale, layoutType, env.keyOf(ns, locale));
}

// --- tests -------------------------------------------------------------------

describe("BlueprintManager — dep graph population", () => {
  it("populates forwardDeps and reverseDeps when loading a blueprint with deps", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", ["g/A", "g/B"]),
        "g/A": () => makeMatrixModule("gear", "inner", []),
        "g/B": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");

    const { forwardDeps, reverseDeps } = env.inspect();
    expect(forwardDeps.get("g/X")).toEqual(new Set(["g/A", "g/B"]));
    expect(reverseDeps.get("g/A")?.has("g/X")).toBe(true);
    expect(reverseDeps.get("g/B")?.has("g/X")).toBe(true);
  });

  it("populates keysByNs with the cache key for each loaded namespace", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", []),
        "s/Y": () => makeRawModule({ greeting: "hi" }),
      },
    });

    await loadByNs(env, "g/X");
    await loadByNs(env, "s/Y", "en-US");

    const { keysByNs } = env.inspect();
    expect(keysByNs.get("g/X")).toEqual(new Set([env.keyOf("g/X")]));
    expect(keysByNs.get("s/Y")).toEqual(new Set([env.keyOf("s/Y", "en-US")]));
  });

  it("includes kit deps in forwardDeps (conservative tracking)", async () => {
    // X has an empty explicit nsDepList but the kit gears are conservatively
    // added: an HMR on g/Kit invalidates g/X even if g/X never imported it.
    const env = createTestEnv({
      kitDeps: { gear: ["g/Kit"], shell: [] },
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", []),
        "g/Kit": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");

    const { forwardDeps } = env.inspect();
    expect(forwardDeps.get("g/X")).toEqual(new Set(["g/Kit"]));
  });

  it("supports a kit with multiple gears (no cycle from kit-mate cross-tracking)", async () => {
    // Two kit gears A and B coexist. Each kit gear conservatively "depends"
    // on every other kit gear in the dep graph, but the BM eager-preloads
    // only the explicit nsDepList of each gear — so kit-mates never wait
    // on each other at blueprint load time. HMR cascade still catches
    // kit-mate invalidations because the dep graph is conservative.
    const env = createTestEnv({
      kitDeps: { gear: ["g/A", "g/B"], shell: [] },
      modules: {
        "g/A": () => makeMatrixModule("gear", "inner", []),
        "g/B": () => makeMatrixModule("gear", "inner", []),
        "g/X": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");
    await loadByNs(env, "g/A");
    await loadByNs(env, "g/B");

    const { forwardDeps, reverseDeps } = env.inspect();
    // X conservatively depends on every kit gear.
    expect(forwardDeps.get("g/X")).toEqual(new Set(["g/A", "g/B"]));
    // Each kit gear conservatively depends on the *other* kit gear.
    expect(forwardDeps.get("g/A")).toEqual(new Set(["g/B"]));
    expect(forwardDeps.get("g/B")).toEqual(new Set(["g/A"]));
    // Reverse graph is consistent: HMR(A) cascade reaches X and B.
    expect(reverseDeps.get("g/A")).toEqual(new Set(["g/X", "g/B"]));
    expect(reverseDeps.get("g/B")).toEqual(new Set(["g/X", "g/A"]));
  });

  it("populates the dep graph transitively as deps are eagerly loaded", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", ["g/Y"]),
        "g/Y": () => makeMatrixModule("gear", "inner", ["g/Z"]),
        "g/Z": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");

    const { forwardDeps, reverseDeps } = env.inspect();
    expect(forwardDeps.get("g/X")).toEqual(new Set(["g/Y"]));
    expect(forwardDeps.get("g/Y")).toEqual(new Set(["g/Z"]));
    expect(reverseDeps.get("g/Y")?.has("g/X")).toBe(true);
    expect(reverseDeps.get("g/Z")?.has("g/Y")).toBe(true);
  });
});

describe("BlueprintManager — closures", () => {
  it("getReverseClosure yields a dispose-safe order (dependents before deps) on a diamond graph", async () => {
    // Graph (forward deps):
    //   g/A → {g/B, g/C}
    //   g/B → {g/D}
    //   g/C → {g/D}
    //   g/D → {}
    // Reverse closure of D = {A, B, C, D} with A *before* B and C, both
    // before D.
    const env = createTestEnv({
      modules: {
        "g/A": () => makeMatrixModule("gear", "inner", ["g/B", "g/C"]),
        "g/B": () => makeMatrixModule("gear", "inner", ["g/D"]),
        "g/C": () => makeMatrixModule("gear", "inner", ["g/D"]),
        "g/D": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/A");

    const order = [...env.bm.getReverseClosure("g/D")];

    expect(order).toContain("g/A");
    expect(order).toContain("g/B");
    expect(order).toContain("g/C");
    expect(order).toContain("g/D");
    // A is a strict dependent of B and C → must come before both.
    expect(order.indexOf("g/A")).toBeLessThan(order.indexOf("g/B"));
    expect(order.indexOf("g/A")).toBeLessThan(order.indexOf("g/C"));
    // B and C are strict dependents of D → must come before D.
    expect(order.indexOf("g/B")).toBeLessThan(order.indexOf("g/D"));
    expect(order.indexOf("g/C")).toBeLessThan(order.indexOf("g/D"));
  });

  it("getForwardClosure walks the forward graph from a starting set", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", ["g/Y"]),
        "g/Y": () => makeMatrixModule("gear", "inner", ["g/Z"]),
        "g/Z": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");

    const closure = env.bm.getForwardClosure(["g/X"]);
    expect(closure).toEqual(new Set(["g/X", "g/Y", "g/Z"]));
  });

  it("reverseBfsDepths computes min distance from any source in reverseDeps", async () => {
    // Graph: A → B → C (A depends on B, B depends on C).
    // reverseDeps(C) = {B}, reverseDeps(B) = {A}.
    // BFS from source C → depths: C=0, B=1, A=2.
    const env = createTestEnv({
      modules: {
        "g/A": () => makeMatrixModule("gear", "inner", ["g/B"]),
        "g/B": () => makeMatrixModule("gear", "inner", ["g/C"]),
        "g/C": () => makeMatrixModule("gear", "inner", []),
      },
    });
    await loadByNs(env, "g/A");

    const depths = env.bm.reverseBfsDepths(["g/C"]);
    expect(depths.get("g/C")).toBe(0);
    expect(depths.get("g/B")).toBe(1);
    expect(depths.get("g/A")).toBe(2);
  });

  it("reverseBfsDepths takes MIN distance across multiple sources", async () => {
    const env = createTestEnv({
      modules: {
        "g/A": () => makeMatrixModule("gear", "inner", ["g/B"]),
        "g/B": () => makeMatrixModule("gear", "inner", ["g/C"]),
        "g/C": () => makeMatrixModule("gear", "inner", []),
      },
    });
    await loadByNs(env, "g/A");

    // Sources = {B, C}. From B: A=1, B=0. From C: A=2, B=1, C=0.
    // Min: A=1, B=0, C=0.
    const depths = env.bm.reverseBfsDepths(["g/B", "g/C"]);
    expect(depths.get("g/A")).toBe(1);
    expect(depths.get("g/B")).toBe(0);
    expect(depths.get("g/C")).toBe(0);
  });

  it("getPriority returns the atlas priority index (lower = higher priority)", async () => {
    const env = createTestEnv({
      modules: {
        "g/A": () => makeMatrixModule("gear", "inner", []),
        "g/B": () => makeMatrixModule("gear", "inner", []),
      },
      priority: ["g/B", "g/A"],
    });
    await loadByNs(env, "g/A");

    expect(env.bm.getPriority("g/B")).toBe(0);
    expect(env.bm.getPriority("g/A")).toBe(1);
    expect(env.bm.getPriority("g/unknown")).toBeUndefined();
  });
});

describe("BlueprintManager — evictBlueprint", () => {
  it("clears cache, forwardDeps and keysByNs for the evicted namespace", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", ["g/A"]),
        "g/A": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");

    env.bm.evictBlueprint("g/X");

    const { cache, forwardDeps, keysByNs } = env.inspect();
    expect(cache.has(env.keyOf("g/X"))).toBe(false);
    expect(forwardDeps.has("g/X")).toBe(false);
    expect(keysByNs.has("g/X")).toBe(false);
  });

  it("removes evicted ns from reverseDeps of its old deps", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", ["g/A"]),
        "g/A": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");
    expect(env.inspect().reverseDeps.get("g/A")?.has("g/X")).toBe(true);

    env.bm.evictBlueprint("g/X");

    expect(env.inspect().reverseDeps.get("g/A")?.has("g/X")).toBe(false);
  });

  it("after evict + reload with different deps, the dep graph reflects only the new deps", async () => {
    let depsForX: string[] = ["g/A"];
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", depsForX),
        "g/A": () => makeMatrixModule("gear", "inner", []),
        "g/B": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");
    expect(env.inspect().reverseDeps.get("g/A")?.has("g/X")).toBe(true);

    env.bm.evictBlueprint("g/X");
    // Simulate file change: X now depends on B instead of A.
    depsForX = ["g/B"];
    await loadByNs(env, "g/X");

    const { forwardDeps, reverseDeps } = env.inspect();
    expect(forwardDeps.get("g/X")).toEqual(new Set(["g/B"]));
    // A no longer has X among its dependents (cleaned at evict time).
    expect(reverseDeps.get("g/A")?.has("g/X")).toBe(false);
    // B now has X among its dependents (registered at the fresh load).
    expect(reverseDeps.get("g/B")?.has("g/X")).toBe(true);
  });
});

describe("BlueprintManager — HMR wiring via reloadModule", () => {
  it("triggers onInvalidate when reloadModule fires for a loaded path", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", []),
      },
    });

    const invalidated: AnyNamespace[] = [];
    env.bm.setOnInvalidate((ns) => invalidated.push(ns));

    await loadByNs(env, "g/X");
    env.triggerHmr("g/X");

    expect(invalidated).toEqual(["g/X"]);
  });

  it("reloadModule on a never-loaded path is a no-op", () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", []),
      },
    });

    const invalidated: AnyNamespace[] = [];
    env.bm.setOnInvalidate((ns) => invalidated.push(ns));

    env.bm.reloadModule("g/never-loaded");

    expect(invalidated).toEqual([]);
  });

  it("reloadModule on a shell path invalidates the underlying namespace and forwards the locale", async () => {
    const env = createTestEnv({
      modules: {
        "s/Y": () => makeRawModule({ greeting: "hi" }),
      },
    });

    const invalidated: Array<[AnyNamespace, string | undefined]> = [];
    env.bm.setOnInvalidate((ns, locale) => invalidated.push([ns, locale]));

    await loadByNs(env, "s/Y", "en");
    env.bm.reloadModule("s/Y/en");

    expect(invalidated).toEqual([["s/Y", "en"]]);
  });

  it("reloadModule on a gear path forwards locale=undefined (gears are not locale-keyed)", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", []),
      },
    });

    const invalidated: Array<[AnyNamespace, string | undefined]> = [];
    env.bm.setOnInvalidate((ns, locale) => invalidated.push([ns, locale]));

    await loadByNs(env, "g/X");
    env.bm.reloadModule("g/X");

    expect(invalidated).toEqual([["g/X", undefined]]);
  });
});

describe("BlueprintManager — evictBlueprint locale scope", () => {
  it("evicts only the matching locale entry for shells when locale is given", async () => {
    const env = createTestEnv({
      modules: {
        "s/Y": () => makeRawModule({ greeting: "hi" }),
      },
    });

    await loadByNs(env, "s/Y", "en");
    await loadByNs(env, "s/Y", "it");

    const { cache } = env.inspect();
    expect(cache.has(env.keyOf("s/Y", "en"))).toBe(true);
    expect(cache.has(env.keyOf("s/Y", "it"))).toBe(true);

    env.bm.evictBlueprint("s/Y", "en");

    expect(cache.has(env.keyOf("s/Y", "en"))).toBe(false);
    expect(cache.has(env.keyOf("s/Y", "it"))).toBe(true);
  });

  it("falls back to full-namespace eviction when locale is given for a non-shell namespace", async () => {
    const env = createTestEnv({
      modules: {
        "g/X": () => makeMatrixModule("gear", "inner", []),
      },
    });

    await loadByNs(env, "g/X");

    const { cache } = env.inspect();
    expect(cache.has(env.keyOf("g/X"))).toBe(true);

    // locale is ignored for non-shells.
    env.bm.evictBlueprint("g/X", "en");

    expect(cache.has(env.keyOf("g/X"))).toBe(false);
  });
});

describe("BlueprintManager — race protection", () => {
  it("identity check: an in-flight resolve interrupted by evict + fresh reload does not pollute the cache", async () => {
    // We need to control when the in-flight loadModule completes. One module
    // call returns a deferred promise; the second returns a fresh module
    // immediately.
    let resolveOldLoad!: (m: AnyResModule) => void;
    const oldLoadPromise = new Promise<AnyResModule>((r) => {
      resolveOldLoad = r;
    });

    let xLoadCount = 0;
    const env = createTestEnv({
      modules: {
        "g/X": () => {
          xLoadCount++;
          // First call returns the deferred (slow) promise. Subsequent calls
          // return a fresh module synchronously.
          return xLoadCount === 1 ? oldLoadPromise : makeMatrixModule("gear", "inner", ["g/B"]);
        },
        "g/A": () => makeMatrixModule("gear", "inner", []),
        "g/B": () => makeMatrixModule("gear", "inner", []),
      },
    });

    // Start an in-flight resolve. Don't await yet.
    const oldPromise = loadByNs(env, "g/X");

    // Evict + start fresh resolve while old is still pending.
    env.bm.evictBlueprint("g/X");
    const newPromise = loadByNs(env, "g/X");

    // Now resolve the old in-flight load with a module pointing at g/A.
    resolveOldLoad(makeMatrixModule("gear", "inner", ["g/A"]));

    await Promise.allSettled([oldPromise, newPromise]);

    const { cache, forwardDeps, reverseDeps } = env.inspect();
    // Cache contains exactly the result of the FRESH load (deps {g/B}), not
    // the stale result of the old in-flight load (deps {g/A}).
    expect(cache.has(env.keyOf("g/X"))).toBe(true);
    expect(forwardDeps.get("g/X")).toEqual(new Set(["g/B"]));
    // The old load's dep graph side effects must not have been applied.
    expect(reverseDeps.get("g/A")?.has("g/X") ?? false).toBe(false);
    expect(reverseDeps.get("g/B")?.has("g/X")).toBe(true);
  });
});
