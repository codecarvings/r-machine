import { describe, expect, it, vi } from "vitest";
import type { BlueprintManager } from "../../src/core/blueprint-manager.js";
import { makeAction } from "../../src/core/reactivity/action-runtime.js";
import {
  createCassetteRecorder,
  type RegisteredRelay,
  type RelayOrderingProvider,
  type RelayRuntime,
} from "../../src/core/reactivity/cassette-recorder.js";
import { createStateCell } from "../../src/core/reactivity/state-cell.js";
import { createRelay, createRelayRuntime } from "../../src/core/relay.js";
import { createBlueprintRelayOrderingProvider } from "../../src/core/relay-ordering.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";

// --- mock BPM helper ----------------------------------------------------

function mockBpm(opts: {
  depths: Map<AnyNamespace, number>;
  priorities?: Map<AnyNamespace, number>;
}): BlueprintManager {
  return {
    reverseBfsDepths: (_sources: Iterable<AnyNamespace>) => opts.depths,
    getPriority: (ns: AnyNamespace) => opts.priorities?.get(ns),
  } as unknown as BlueprintManager;
}

function entry(runtime: RelayRuntime, namespace?: AnyNamespace): RegisteredRelay {
  return { runtime, namespace };
}

function fakeRuntime(label: string): RelayRuntime {
  return {
    runIfDirty: () => {
      /* not called in provider unit tests */
    },
    dispose: () => {},
    // attach a tag for visibility in failures
    toString: () => label,
  } as RelayRuntime;
}

describe("createBlueprintRelayOrderingProvider", () => {
  it("sorts dirty relays by depth (ascending) — same OG before dependent OG", () => {
    const provider = createBlueprintRelayOrderingProvider(
      mockBpm({
        depths: new Map<AnyNamespace, number>([
          ["a", 0],
          ["b", 1],
        ]),
      })
    );
    const r1 = fakeRuntime("r1@a"); // depth 0
    const r2 = fakeRuntime("r2@b"); // depth 1
    const full: RegisteredRelay[] = [entry(r2, "b"), entry(r1, "a")]; // registration order: r2 then r1
    const ordered = provider.order(new Set([r1, r2]), new Set(["a"]), full);
    expect(ordered).toEqual([r1, r2]); // depth-0 first
  });

  it("breaks ties by priority (lower priority index = higher priority) within same depth", () => {
    const provider = createBlueprintRelayOrderingProvider(
      mockBpm({
        depths: new Map<AnyNamespace, number>([
          ["a", 1],
          ["b", 1],
        ]),
        priorities: new Map<AnyNamespace, number>([
          ["b", 0],
          ["a", 1],
        ]),
      })
    );
    const ra = fakeRuntime("ra@a");
    const rb = fakeRuntime("rb@b");
    const full: RegisteredRelay[] = [entry(ra, "a"), entry(rb, "b")];
    const ordered = provider.order(new Set([ra, rb]), new Set(["src"]), full);
    expect(ordered).toEqual([rb, ra]); // b has priority 0, fires before a
  });

  it("breaks final ties by registration order (FIFO)", () => {
    const provider = createBlueprintRelayOrderingProvider(
      mockBpm({ depths: new Map<AnyNamespace, number>([["a", 0]]) })
      // no priorities → same priority Infinity for both
    );
    const r1 = fakeRuntime("r1@a");
    const r2 = fakeRuntime("r2@a");
    const full: RegisteredRelay[] = [entry(r1, "a"), entry(r2, "a")];
    const ordered = provider.order(new Set([r1, r2]), new Set(["a"]), full);
    expect(ordered).toEqual([r1, r2]);
  });

  it("relays with no hosting namespace fire LAST (depth = Infinity)", () => {
    const provider = createBlueprintRelayOrderingProvider(
      mockBpm({ depths: new Map<AnyNamespace, number>([["a", 0]]) })
    );
    const ra = fakeRuntime("ra@a");
    const rOrphan = fakeRuntime("orphan");
    const full: RegisteredRelay[] = [entry(rOrphan, undefined), entry(ra, "a")];
    const ordered = provider.order(new Set([ra, rOrphan]), new Set(["a"]), full);
    expect(ordered).toEqual([ra, rOrphan]); // ra fires first (depth 0); orphan last
  });

  it("namespaces not reachable from any source fall back to Infinity (fire after reachable ones)", () => {
    const provider = createBlueprintRelayOrderingProvider(
      mockBpm({ depths: new Map<AnyNamespace, number>([["a", 0]]) })
    );
    const ra = fakeRuntime("ra@a");
    const rz = fakeRuntime("rz@z"); // z not in the depths map
    const full: RegisteredRelay[] = [entry(rz, "z"), entry(ra, "a")];
    const ordered = provider.order(new Set([ra, rz]), new Set(["a"]), full);
    expect(ordered).toEqual([ra, rz]);
  });

  it("excludes non-dirty relays from output", () => {
    const provider = createBlueprintRelayOrderingProvider(
      mockBpm({ depths: new Map<AnyNamespace, number>([["a", 0]]) })
    );
    const r1 = fakeRuntime("r1");
    const r2 = fakeRuntime("r2");
    const r3 = fakeRuntime("r3");
    const full: RegisteredRelay[] = [entry(r1, "a"), entry(r2, "a"), entry(r3, "a")];
    const ordered = provider.order(new Set([r1, r3]), new Set(["a"]), full);
    expect(ordered).toEqual([r1, r3]);
  });
});

describe("recorder.setRelayOrderingProvider integration", () => {
  it("flush uses the installed provider to determine execution order", () => {
    const recorder = createCassetteRecorder();
    // Build a custom provider that reverses registration order.
    const provider: RelayOrderingProvider = {
      order: (dirty, _sources, full) => {
        return full
          .filter((e) => dirty.has(e.runtime))
          .map((e) => e.runtime)
          .reverse();
      },
    };
    recorder.setRelayOrderingProvider(provider);

    const cell = createStateCell(0, recorder);
    const order: string[] = [];
    createRelayRuntime(
      createRelay(
        {
          select: () => cell.read(),
          onChange: () => {
            order.push("r1");
          },
        },
        "r1"
      ),
      recorder
    );
    createRelayRuntime(
      createRelay(
        {
          select: () => cell.read(),
          onChange: () => {
            order.push("r2");
          },
        },
        "r2"
      ),
      recorder
    );

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(1);

    // Provider reverses → r2 before r1.
    expect(order).toEqual(["r2", "r1"]);
  });

  it("registration order is preserved without a provider (Step 1 fallback)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const order: string[] = [];
    createRelayRuntime(
      createRelay(
        {
          select: () => cell.read(),
          onChange: () => {
            order.push("r1");
          },
        },
        "r1"
      ),
      recorder
    );
    createRelayRuntime(
      createRelay(
        {
          select: () => cell.read(),
          onChange: () => {
            order.push("r2");
          },
        },
        "r2"
      ),
      recorder
    );

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(1);

    expect(order).toEqual(["r1", "r2"]);
  });

  it("source namespaces accumulated during tx are passed to the provider", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const sourcesSpy = vi.fn();
    const provider: RelayOrderingProvider = {
      order: (dirty, sources, full) => {
        sourcesSpy(new Set(sources));
        return full.filter((e) => dirty.has(e.runtime)).map((e) => e.runtime);
      },
    };
    recorder.setRelayOrderingProvider(provider);
    createRelayRuntime(createRelay({ select: () => cell.read(), onChange: () => {} }, "r"), recorder);

    const set = makeAction(cell, (n: number) => n, recorder, "set", "myOG");
    set(1);

    expect(sourcesSpy).toHaveBeenCalledTimes(1);
    expect(sourcesSpy).toHaveBeenCalledWith(new Set(["myOG"]));
  });

  it("nested actions accumulate multiple source namespaces", () => {
    const recorder = createCassetteRecorder();
    const cellA = createStateCell(0, recorder);
    const cellB = createStateCell(0, recorder);
    const sourcesSpy = vi.fn();
    const provider: RelayOrderingProvider = {
      order: (dirty, sources, full) => {
        sourcesSpy(new Set(sources));
        return full.filter((e) => dirty.has(e.runtime)).map((e) => e.runtime);
      },
    };
    recorder.setRelayOrderingProvider(provider);
    createRelayRuntime(createRelay({ select: () => cellA.read(), onChange: () => {} }, "r"), recorder);

    const setB = makeAction(cellB, (n: number) => n, recorder, "setB", "ogB");
    const setA = makeAction(
      cellA,
      (n: number) => {
        setB(n * 10);
        return n;
      },
      recorder,
      "setA",
      "ogA"
    );

    setA(1);
    expect(sourcesSpy).toHaveBeenCalledWith(new Set(["ogA", "ogB"]));
  });

  it("txSources are cleared between flushes (no leakage)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const sourcesSeen: Array<Set<AnyNamespace>> = [];
    const provider: RelayOrderingProvider = {
      order: (dirty, sources, full) => {
        sourcesSeen.push(new Set(sources));
        return full.filter((e) => dirty.has(e.runtime)).map((e) => e.runtime);
      },
    };
    recorder.setRelayOrderingProvider(provider);
    createRelayRuntime(createRelay({ select: () => cell.read(), onChange: () => {} }, "r"), recorder);

    const setX = makeAction(cell, (n: number) => n, recorder, "setX", "ogX");
    const setY = makeAction(cell, (n: number) => n + 100, recorder, "setY", "ogY");
    setX(1);
    setY(1);

    expect(sourcesSeen).toEqual([new Set(["ogX"]), new Set(["ogY"])]);
  });
});
