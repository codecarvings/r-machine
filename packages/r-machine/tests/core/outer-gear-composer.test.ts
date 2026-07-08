import { describe, expect, it, vi } from "vitest";
import { createCassetteRecorder } from "../../src/core/cassette-recorder.js";
import { isCmd } from "../../src/core/cmd.js";
import {
  buildStatefulOuterGearCursor,
  createOuterGearComposer,
  wrapWithRelayCleanup,
} from "../../src/core/outer-gear-composer.js";
import { type AnyRes, tryGetDispose } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import { type AnyResMatrix, instantiateRes } from "../../src/core/res-matrix.js";
import { createStateCell } from "../../src/core/state-cell.js";
import { buildResolveEnv, outerGearModule } from "../_fixtures/build-resolve-env.js";

const LAYOUT: AnyResLayout = { "g/": "gear:outer" };

// Mock connector that augments a fresh map-form ctx (`{ $ }`) — the same path
// ResManager drives, but without the blueprint stack. Used where a test needs
// the RAW resource (e.g. to reach `Symbol.dispose`, which the pod surface strips).
function mockMapConnector(): ResComposerConnector {
  return {
    getWire: async (_nsDeps: unknown, _locale: unknown, augmentCtx: (ctx: unknown) => void) => {
      const $: Record<string, unknown> = {};
      augmentCtx($);
      return { plugin: { $ } };
    },
  } as unknown as ResComposerConnector;
}

// A reusable stateful counter used as a dependency target throughout.
const counterModule = outerGearModule((c) =>
  c.withState({ count: 0 }).define((p: any, cursor: any) => ({
    read: cursor.getter(() => p.$.state.count),
    add: cursor.action((n: number) => ({ count: p.$.state.count + n })),
  }))
);

// =============================================================================
// Builder-chain coverage: every withDeps / withPorts / withState entry point
// reachable through the PUBLIC composer, resolved end-to-end.
// =============================================================================

describe("OuterGear composer — map-deps builder chains", () => {
  it("withDeps({map}).define → factory sees `{ named, $ }` (stateless)", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/view": outerGearModule((c) =>
        (c.withDeps as any)({ ctr: "g/counter" }).define(({ ctr, $ }: any, cursor: any) => ({
          mirror: cursor.getter(() => ctr.read),
          hasDollar: cursor.getter(() => $ !== undefined),
        }))
      ),
    });

    const res = (await env.resolve("g/view" as AnyNamespace)) as { mirror: number; hasDollar: boolean };
    expect(res.mirror).toBe(0);
    expect(res.hasDollar).toBe(true);
  });

  it("withDeps({map}).withPorts({...}).define → ports reachable via `$.ports.*`", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/view": outerGearModule((c) =>
        (c.withDeps as any)({ ctr: "g/counter" })
          .withPorts({ tag: () => "P" })
          .define(({ ctr, $ }: any, cursor: any) => ({
            mirror: cursor.getter(() => ctr.read),
            tag: cursor.getter(() => $.ports.tag()),
          }))
      ),
    });

    const res = (await env.resolve("g/view" as AnyNamespace)) as { mirror: number; tag: string };
    expect(res.tag).toBe("P");
  });

  it("withDeps({map}).withState(default).define → stateful map gear with deps", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/view": outerGearModule((c) =>
        (c.withDeps as any)({ ctr: "g/counter" })
          .withState({ local: 1 })
          .define(({ ctr, $ }: any, cursor: any) => ({
            mirror: cursor.getter(() => ctr.read),
            local: cursor.getter(() => $.state.local),
            bump: cursor.action(() => ({ local: $.state.local + 1 })),
          }))
      ),
    });

    const res = (await env.resolve("g/view" as AnyNamespace)) as {
      mirror: number;
      local: number;
      bump: () => unknown;
    };
    expect(res.local).toBe(1);
    res.bump();
    expect(res.local).toBe(2);
  });

  it("withDeps({map}).withPorts({...}).withState(default).define → ports + state together", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/view": outerGearModule((c) =>
        (c.withDeps as any)({ ctr: "g/counter" })
          .withPorts({ tag: () => "Z" })
          .withState({ local: 0 })
          .define(({ $ }: any, cursor: any) => ({
            tag: cursor.getter(() => $.ports.tag()),
            local: cursor.getter(() => $.state.local),
          }))
      ),
    });

    const res = (await env.resolve("g/view" as AnyNamespace)) as { tag: string; local: number };
    expect(res.tag).toBe("Z");
    expect(res.local).toBe(0);
  });
});

describe("OuterGear composer — list-deps builder chains", () => {
  it("withDeps(list).define → stateless list gear, factory sees `[...deps, $]`", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/view": outerGearModule((c) =>
        (c.withDeps as any)("g/counter").define(([ctr, $]: any, cursor: any) => ({
          mirror: cursor.getter(() => ctr.read),
          hasDollar: cursor.getter(() => $ !== undefined),
        }))
      ),
    });

    const res = (await env.resolve("g/view" as AnyNamespace)) as { mirror: number; hasDollar: boolean };
    expect(res.mirror).toBe(0);
    expect(res.hasDollar).toBe(true);
  });

  it("withDeps(list).withPorts({...}).define → ports on a list gear", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/view": outerGearModule((c) =>
        (c.withDeps as any)("g/counter")
          .withPorts({ tag: () => "L" })
          .define(([_ctr, $]: any, cursor: any) => ({
            tag: cursor.getter(() => $.ports.tag()),
          }))
      ),
    });

    expect(((await env.resolve("g/view" as AnyNamespace)) as { tag: string }).tag).toBe("L");
  });

  it("withDeps(list).withPorts({...}).withState(default).define → list ports + state", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/view": outerGearModule((c) =>
        (c.withDeps as any)("g/counter")
          .withPorts({ tag: () => "LS" })
          .withState({ local: 3 })
          .define(([_ctr, $]: any, cursor: any) => ({
            tag: cursor.getter(() => $.ports.tag()),
            local: cursor.getter(() => $.state.local),
          }))
      ),
    });

    const res = (await env.resolve("g/view" as AnyNamespace)) as { tag: string; local: number };
    expect(res.tag).toBe("LS");
    expect(res.local).toBe(3);
  });
});

describe("OuterGear composer — top-level withPorts / withState (no deps)", () => {
  it("withPorts({...}).withState(default).define → ports + state on a bare gear", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": outerGearModule((c) =>
        c
          .withPorts({ tag: () => "T" })
          .withState({ n: 0 })
          .define(({ $ }: any, cursor: any) => ({
            tag: cursor.getter(() => $.ports.tag()),
            n: cursor.getter(() => $.state.n),
            inc: cursor.action(() => ({ n: $.state.n + 1 })),
          }))
      ),
    });

    const res = (await env.resolve("g/g" as AnyNamespace)) as { tag: string; n: number; inc: () => unknown };
    expect(res.tag).toBe("T");
    res.inc();
    expect(res.n).toBe(1);
  });

  it("withPorts({...}).define → ports on a stateless bare gear", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": outerGearModule((c) =>
        (c.withPorts as any)({ tag: () => "U" }).define(({ $ }: any, cursor: any) => ({
          tag: cursor.getter(() => $.ports.tag()),
        }))
      ),
    });

    expect(((await env.resolve("g/g" as AnyNamespace)) as { tag: string }).tag).toBe("U");
  });
});

// =============================================================================
// StateDef shorthand: a factory returning `[getterName]` or
// `[getterName, actionName]` is expanded by convertStatefulRaw.
// =============================================================================

describe("OuterGear composer — StateDef shorthand factories", () => {
  it("readonly `[getterName]` → single state getter exposing the whole state", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": outerGearModule((c) => c.withState({ v: 7 }).define(() => ["value"] as const)),
    });

    expect(((await env.resolve("g/g" as AnyNamespace)) as { value: { v: number } }).value).toEqual({ v: 7 });
  });

  it("writable `[getterName, actionName]` → getter + default-merge action", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": outerGearModule((c) => c.withState({ v: 0 }).define(() => ["value", "setValue"] as const)),
    });

    const res = (await env.resolve("g/g" as AnyNamespace)) as {
      value: { v: number };
      setValue: (partial: { v: number }) => unknown;
    };
    expect(res.value).toEqual({ v: 0 });
    res.setValue({ v: 5 });
    expect(res.value).toEqual({ v: 5 });
  });
});

// =============================================================================
// runOuterFactory: async factory body, and a sync body with a sync clone fn.
// =============================================================================

describe("OuterGear composer — async factory and sync clone fold", () => {
  it("an async define body resolves through the async branch of runOuterFactory", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": outerGearModule((c) =>
        c.define(async (_p: any, cursor: any) => {
          await Promise.resolve();
          return { v: cursor.getter(() => 42) };
        })
      ),
    });

    expect(((await env.resolve("g/g" as AnyNamespace)) as { v: number }).v).toBe(42);
  });

  it("a sync clone fn over a sync body stays on the synchronous fold path", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": outerGearModule((c) =>
        (c.define((_p: any, cursor: any) => ({ v: cursor.getter(() => 1) })) as any).clone(
          (res: any, _p: any, cursor: any) => ({
            v: res.v,
            doubled: cursor.getter(() => 2),
          })
        )
      ),
    });

    const res = (await env.resolve("g/g" as AnyNamespace)) as { v: number; doubled: number };
    expect(res.v).toBe(1);
    expect(res.doubled).toBe(2);
  });
});

// =============================================================================
// clone() / withPorts() / withState() permutations on the matrices.
// =============================================================================

describe("OuterGear composer — stateless matrix clone & port overrides", () => {
  it("map: clone() with no transform, and withPorts(overrides).clone()", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/plain": outerGearModule((c) =>
        (c.define((_p: any, cursor: any) => ({ v: cursor.getter(() => 1) })) as any).clone()
      ),
      "g/ported": outerGearModule((c) =>
        (
          (c.withPorts as any)({ n: () => 1 }).define(({ $ }: any, cursor: any) => ({
            v: cursor.getter(() => $.ports.n()),
          })) as any
        )
          .withPorts({ n: () => 9 })
          .clone()
      ),
    });

    expect(((await env.resolve("g/plain" as AnyNamespace)) as { v: number }).v).toBe(1);
    expect(((await env.resolve("g/ported" as AnyNamespace)) as { v: number }).v).toBe(9);
  });

  it("list: clone(fn) and withPorts(overrides).clone()", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/cloned": outerGearModule((c) =>
        (
          (c.withDeps as any)("g/counter").define(([ctr]: any, cursor: any) => ({
            m: cursor.getter(() => ctr.read),
          })) as any
        ).clone((res: any, _p: any, cursor: any) => ({ m: res.m, extra: cursor.getter(() => 1) }))
      ),
      "g/ported": outerGearModule((c) =>
        (
          (c.withDeps as any)("g/counter")
            .withPorts({ n: () => 1 })
            .define(([_ctr, $]: any, cursor: any) => ({ v: cursor.getter(() => $.ports.n()) })) as any
        )
          .withPorts({ n: () => 7 })
          .clone()
      ),
    });

    const cloned = (await env.resolve("g/cloned" as AnyNamespace)) as { m: number; extra: number };
    expect(cloned.extra).toBe(1);
    expect(((await env.resolve("g/ported" as AnyNamespace)) as { v: number }).v).toBe(7);
  });
});

describe("OuterGear composer — stateful matrix clone & port/state overrides", () => {
  // Build a ported + stateful map gear so every override builder is reachable.
  const portedStatefulMap = (over: (m: any) => any) =>
    outerGearModule((c) => {
      const m = c
        .withPorts({ tag: () => "base" })
        .withState({ n: 0 })
        .define(({ $ }: any, cursor: any) => ({
          tag: cursor.getter(() => $.ports.tag()),
          n: cursor.getter(() => $.state.n),
        }));
      return over(m);
    });

  it("map: clone(fn) folds an extra member over the converted resource", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": portedStatefulMap((m) =>
        m.clone((res: any, _p: any, cursor: any) => ({ ...res, extra: cursor.getter(() => 1) }))
      ),
    });
    const res = (await env.resolve("g/g" as AnyNamespace)) as { tag: string; n: number; extra: number };
    expect(res.extra).toBe(1);
  });

  it("map: withPorts(overrides).clone() applies the port override", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": portedStatefulMap((m) => m.withPorts({ tag: () => "p2" }).clone()),
    });
    expect(((await env.resolve("g/g" as AnyNamespace)) as { tag: string }).tag).toBe("p2");
  });

  it("map: withPorts(overrides).withState(overrides).clone() applies both", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": portedStatefulMap((m) =>
        m
          .withPorts({ tag: () => "p3" })
          .withState({ n: 5 })
          .clone()
      ),
    });
    const res = (await env.resolve("g/g" as AnyNamespace)) as { tag: string; n: number };
    expect(res.tag).toBe("p3");
    expect(res.n).toBe(5);
  });

  it("map: withState(overrides).clone() and withState(overrides).withPorts(overrides).clone()", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/state": portedStatefulMap((m) => m.withState({ n: 8 }).clone()),
      "g/both": portedStatefulMap((m) =>
        m
          .withState({ n: 9 })
          .withPorts({ tag: () => "p4" })
          .clone()
      ),
    });
    expect(((await env.resolve("g/state" as AnyNamespace)) as { n: number }).n).toBe(8);
    const both = (await env.resolve("g/both" as AnyNamespace)) as { tag: string; n: number };
    expect(both.tag).toBe("p4");
    expect(both.n).toBe(9);
  });

  // Ported + stateful LIST gear (has a dep so it's the list builder).
  const portedStatefulList = (over: (m: any) => any) =>
    outerGearModule((c) => {
      const m = (c.withDeps as any)("g/counter")
        .withPorts({ tag: () => "base" })
        .withState({ n: 0 })
        .define(([_ctr, $]: any, cursor: any) => ({
          tag: cursor.getter(() => $.ports.tag()),
          n: cursor.getter(() => $.state.n),
        }));
      return over(m);
    });

  it("list: clone(), withPorts/withState override permutations", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/clone": portedStatefulList((m) => m.clone((res: any) => res)),
      "g/pw": portedStatefulList((m) => m.withPorts({ tag: () => "lp" }).clone()),
      "g/pws": portedStatefulList((m) =>
        m
          .withPorts({ tag: () => "lp2" })
          .withState({ n: 1 })
          .clone()
      ),
      "g/sw": portedStatefulList((m) => m.withState({ n: 2 }).clone()),
      "g/swp": portedStatefulList((m) =>
        m
          .withState({ n: 3 })
          .withPorts({ tag: () => "lp3" })
          .clone()
      ),
    });

    expect(((await env.resolve("g/clone" as AnyNamespace)) as { tag: string; n: number }).tag).toBe("base");
    expect(((await env.resolve("g/pw" as AnyNamespace)) as { tag: string }).tag).toBe("lp");
    const pws = (await env.resolve("g/pws" as AnyNamespace)) as { tag: string; n: number };
    expect(pws.tag).toBe("lp2");
    expect(pws.n).toBe(1);
    expect(((await env.resolve("g/sw" as AnyNamespace)) as { n: number }).n).toBe(2);
    const swp = (await env.resolve("g/swp" as AnyNamespace)) as { tag: string; n: number };
    expect(swp.tag).toBe("lp3");
    expect(swp.n).toBe(3);
  });
});

// =============================================================================
// Chained clones: the second clone composes its fn over the first (the
// compose*Fn helpers' prev/next folding).
// =============================================================================

describe("OuterGear composer — chained clone folding", () => {
  it("stateless: clone(fn1).clone() keeps fn1; clone(fn1).clone(fn2) folds fn2∘fn1", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/keep": outerGearModule((c) =>
        (c.define((_p: any, cursor: any) => ({ a: cursor.getter(() => 1) })) as any)
          .clone((res: any, _p: any, cursor: any) => ({ ...res, b: cursor.getter(() => 2) }))
          .clone()
      ),
      "g/fold": outerGearModule((c) =>
        (c.define((_p: any, cursor: any) => ({ a: cursor.getter(() => 1) })) as any)
          .clone((res: any, _p: any, cursor: any) => ({ ...res, b: cursor.getter(() => 2) }))
          .clone((res: any, _p: any, cursor: any) => ({ ...res, cc: cursor.getter(() => 3) }))
      ),
    });

    const keep = (await env.resolve("g/keep" as AnyNamespace)) as { a: number; b: number };
    expect(keep.b).toBe(2);
    const fold = (await env.resolve("g/fold" as AnyNamespace)) as { a: number; b: number; cc: number };
    expect(fold.b).toBe(2);
    expect(fold.cc).toBe(3);
  });

  it("stateful: clone(fn1).clone() keeps fn1; clone(fn1).clone(fn2) folds fn2∘fn1", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/keep": outerGearModule((c) =>
        (c.withState({ n: 0 }).define(({ $ }: any, cursor: any) => ({ a: cursor.getter(() => $.state.n) })) as any)
          .clone((res: any, _p: any, cursor: any) => ({ ...res, b: cursor.getter(() => 2) }))
          .clone()
      ),
      "g/fold": outerGearModule((c) =>
        (c.withState({ n: 0 }).define(({ $ }: any, cursor: any) => ({ a: cursor.getter(() => $.state.n) })) as any)
          .clone((res: any, _p: any, cursor: any) => ({ ...res, b: cursor.getter(() => 2) }))
          .clone((res: any, _p: any, cursor: any) => ({ ...res, cc: cursor.getter(() => 3) }))
      ),
    });

    const keep = (await env.resolve("g/keep" as AnyNamespace)) as { a: number; b: number };
    expect(keep.b).toBe(2);
    const fold = (await env.resolve("g/fold" as AnyNamespace)) as { a: number; b: number; cc: number };
    expect(fold.b).toBe(2);
    expect(fold.cc).toBe(3);
  });

  it("an async stateful body with a clone fn folds through the async conversion path", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": outerGearModule((c) =>
        (
          c.withState({ n: 0 }).define(async ({ $ }: any, cursor: any) => {
            await Promise.resolve();
            return { n: cursor.getter(() => $.state.n) };
          }) as any
        ).clone((res: any, _p: any, cursor: any) => ({ ...res, extra: cursor.getter(() => 9) }))
      ),
    });

    const res = (await env.resolve("g/g" as AnyNamespace)) as { n: number; extra: number };
    expect(res.n).toBe(0);
    expect(res.extra).toBe(9);
  });
});

// =============================================================================
// Stateful cursor cmd composer.
// =============================================================================

describe("OuterGear composer — stateful cursor cmd", () => {
  it("cursor.cmd(action, payload) builds a Cmd targeting the action", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/g": outerGearModule((c) =>
        c.withState({ n: 0 }).define(({ $ }: any, cursor: any) => {
          const add = cursor.action((x: number) => ({ n: $.state.n + x }));
          const command = cursor.cmd(add, 1);
          return { add, isCommand: cursor.getter(() => isCmd(command)) };
        })
      ),
    });

    expect(((await env.resolve("g/g" as AnyNamespace)) as { isCommand: boolean }).isCommand).toBe(true);
  });
});

// =============================================================================
// Stateless cursor relay teardown — reached via the matrix's raw resource,
// since the pod surface strips Symbol.dispose.
// =============================================================================

describe("OuterGear composer — stateless relay teardown", () => {
  it("disposing the raw resource runs the relay's registered dispose", async () => {
    const recorder = createCassetteRecorder();
    const composer = createOuterGearComposer<any, any>(mockMapConnector(), recorder);
    const ext = createStateCell({ v: 0 }, recorder);
    const onChange = vi.fn();

    const matrix = composer.define((_p: any, cursor: any) => {
      cursor.relay({ select: () => ext.read().v, onChange });
      return { read: cursor.getter(() => ext.read().v) };
    });

    const raw = (await instantiateRes(matrix as AnyResMatrix)) as AnyRes;
    const dispose = tryGetDispose(raw);
    expect(dispose).toBeDefined();

    // After disposal the relay is torn down: a subsequent mutation does not fire.
    dispose?.();
    ext.publish({ v: 1 });
    expect(onChange).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Stateless cursor: relay + cmd composers (reachable only via a resolved
// stateless gear).
// =============================================================================

describe("OuterGear composer — stateless cursor relay & cmd", () => {
  it("a stateless gear can register a relay and build a cmd targeting a dep action", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": counterModule,
      "g/effect": outerGearModule((c) =>
        (c.withDeps as any)("g/counter").define(([ctr, _$]: any, cursor: any) => {
          // Side-effect relay: registration exercises the stateless relay composer.
          cursor.relay({ select: () => ctr.read, onChange: () => {} });
          // cmd targeting the dependency's action exercises the cmd composer.
          const command = cursor.cmd(ctr.add, 1);
          return {
            mirror: cursor.getter(() => ctr.read),
            isCommand: cursor.getter(() => isCmd(command)),
          };
        })
      ),
    });

    const res = (await env.resolve("g/effect" as AnyNamespace)) as { mirror: number; isCommand: boolean };
    expect(res.mirror).toBe(0);
    expect(res.isCommand).toBe(true);
  });
});

// =============================================================================
// Direct unit tests on exported helpers.
// =============================================================================

describe("buildStatefulOuterGearCursor — invalid getter arguments", () => {
  it("getter(nonFunction) throws a usage error", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ n: 0 }, recorder);
    const cursor = buildStatefulOuterGearCursor(cell, recorder);

    expect(() => (cursor.getter as unknown as (a: unknown) => unknown)(42)).toThrow(/invalid arguments/);
  });
});

describe("wrapWithRelayCleanup — combined dispose error handling", () => {
  it("catches throwing user-dispose AND throwing relay-dispose, and is idempotent", () => {
    const recorder = createCassetteRecorder();
    // Patch registerRelay so the relay's unregister (called on dispose) throws —
    // this is the realistic seam that makes a relay's dispose fail.
    const origRegister = recorder.registerRelay.bind(recorder);
    recorder.registerRelay = ((rt: never, ns: never) => {
      origRegister(rt, ns);
      return () => {
        throw new Error("unregister boom");
      };
    }) as typeof recorder.registerRelay;

    const cell = createStateCell({ x: 1 }, recorder);
    const cursor = buildStatefulOuterGearCursor(cell, recorder);
    // Register a relay whose dispose will now throw via the patched unregister.
    (cursor.relay as unknown as (cfg: unknown) => unknown)({ select: () => cell.read().x, onChange: () => {} });

    const resource = {
      ok: 1,
      [Symbol.dispose]: () => {
        throw new Error("user dispose boom");
      },
    } as unknown as AnyRes;

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const wrapped = wrapWithRelayCleanup(resource, cursor);
      const dispose = tryGetDispose(wrapped);
      expect(dispose).toBeDefined();

      // First call: both the user dispose and the relay dispose throw; both are
      // swallowed and logged (one console.error each).
      dispose?.();
      expect(errorSpy).toHaveBeenCalledTimes(2);

      // Second call: the `disposed` guard short-circuits — no further logging.
      dispose?.();
      expect(errorSpy).toHaveBeenCalledTimes(2);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("returns the resource untouched when there is neither a user dispose nor relays", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ x: 1 }, recorder);
    const cursor = buildStatefulOuterGearCursor(cell, recorder);

    const resource = { v: 1 } as unknown as AnyRes;
    const wrapped = wrapWithRelayCleanup(resource, cursor);

    expect(wrapped).toBe(resource);
    expect(tryGetDispose(wrapped)).toBeUndefined();
  });

  it("tolerates a cursor with no relay-cleanup slot (defaults to no relays)", () => {
    // A bare object carries no relay-cleanup list → the `?? []` fallback applies.
    const resource = { v: 1 } as unknown as AnyRes;
    const wrapped = wrapWithRelayCleanup(resource, {});

    expect(wrapped).toBe(resource);
    expect(tryGetDispose(wrapped)).toBeUndefined();
  });
});
