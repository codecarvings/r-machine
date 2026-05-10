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
  // Captured onUpdate per ns. Fresh modules overwrite so the latest callback
  // is always reachable — that mirrors what a real Vite plugin would do.
  const callbacks = new Map<string, () => void>();
  const loadCalls: string[] = [];

  const loader = async (_path: string, opts?: ResModuleLoaderFnOptions): Promise<AnyResModule> => {
    if (!opts) {
      throw new Error("expected ResModuleLoaderFnOptions");
    }
    loadCalls.push(opts.namespace);
    callbacks.set(opts.namespace, opts.onUpdate);
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
    options.priority ?? []
  );

  return {
    bm,
    triggerHmr: (ns: string) => {
      const cb = callbacks.get(ns);
      if (!cb) {
        throw new Error(`No onUpdate captured for "${ns}"`);
      }
      cb();
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

describe("BlueprintManager — HMR wiring", () => {
  it("triggers onInvalidate when the captured onUpdate fires", async () => {
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
