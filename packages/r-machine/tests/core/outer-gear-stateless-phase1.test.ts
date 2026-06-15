import { describe, expect, it, vi } from "vitest";
import { createCassetteRecorder } from "../../src/core/cassette-recorder.js";
import { type Getter, isGetter } from "../../src/core/getter.js";
import { buildGetterCellComposer, buildStatelessGetterComposer } from "../../src/core/outer-gear-composer.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import { createResMatrix } from "../../src/core/res-matrix.js";
import { buildResPod } from "../../src/core/res-pod.js";
import { createStateCell } from "../../src/core/state-cell.js";

// --- helpers -----------------------------------------------------------------

type InternalCreateCall = (locale: undefined, chain: never[]) => Promise<unknown>;
async function resolve(matrix: { create: () => Promise<unknown> }): Promise<unknown> {
  const raw = await (matrix.create as unknown as InternalCreateCall)(undefined, []);
  return buildResPod(raw as AnyRes, undefined).surface;
}

function makeConnector(): ResComposerConnector {
  return {
    getWire: async (_nsDeps: unknown, _locale: unknown, buildCtx: (ctx: unknown) => void, _chain: unknown) => {
      const $: Record<string, unknown> = {};
      buildCtx($);
      return { plugin: $ };
    },
  } as unknown as ResComposerConnector;
}

// --- unit tests on the stateless getter composer -----------------------------

describe("buildStatelessGetterComposer", () => {
  it("getter(body) returns a branded callable Getter that reads through the body", () => {
    const composer = buildStatelessGetterComposer();
    const body = vi.fn(() => 42);
    const g = composer(body);

    expect(isGetter(g)).toBe(true);
    expect((g as Getter<number>)()).toBe(42);
    // No memoization: each invocation goes through to the body.
    expect((g as Getter<number>)()).toBe(42);
    expect(body).toHaveBeenCalledTimes(2);
  });

  it("throws on invalid arguments shape", () => {
    const composer = buildStatelessGetterComposer() as unknown as (...a: unknown[]) => unknown;
    expect(() => composer()).toThrow(/invalid arguments/);
    expect(() => composer("not-a-function", () => 1)).toThrow(/invalid arguments/);
    expect(() => composer(42)).toThrow(/invalid arguments/);
  });
});

// --- unit tests on the cell composer (getterCell) ----------------------------

describe("buildCellComposer", () => {
  it("cell(body) returns a Getter backed by a GetterCell (memoized)", () => {
    const recorder = createCassetteRecorder();
    const cell = buildGetterCellComposer(recorder);
    const body = vi.fn(() => 7);
    const g = cell(body) as Getter<number>;

    expect(isGetter(g)).toBe(true);
    expect(g()).toBe(7);
    expect(g()).toBe(7);
    // Cache hit on the second read — body invoked exactly once.
    expect(body).toHaveBeenCalledTimes(1);
  });

  it("cell participates in cassette tracking like the stateful counterpart", () => {
    const recorder = createCassetteRecorder();
    const cell = buildGetterCellComposer(recorder);
    const upstream = createStateCell({ v: 1 }, recorder);
    const g = cell(() => upstream.read().v * 10) as Getter<number>;

    // Prime so the next read is a cache hit.
    g();

    const outer = recorder.createCassette();
    outer.insert();
    g();
    outer.eject();

    // Cache hit registers the getter cell only (not the upstream cell).
    expect(outer.getDeps().size).toBe(1);
    expect(outer.getDeps()).not.toContain(upstream);
  });
});

// --- integration via createResMatrix ----------------------------------------

describe("Stateless OuterGear — end-to-end via createResMatrix", () => {
  it("user-factory can declare a cell on a stateless gear and it tracks deps via cassettes", async () => {
    const recorder = createCassetteRecorder();
    // Build an external state cell to act as the gear's dependency surface — the
    // stateless gear's factory closes over it directly. In production this is
    // what `plugin.<depName>` would expose; here we wire it manually.
    const upstream = createStateCell({ count: 5 }, recorder);

    const matrix = createResMatrix({
      connector: makeConnector(),
      meta: { family: "gear", role: "outer" },
      head: { realm: "res", family: "gear", mode: "map", deps: [], nsDeps: [], nsDepList: [], ports: {} } as never,
      cursor: {
        getter: buildStatelessGetterComposer(),
        cell: buildGetterCellComposer(recorder),
        relay: () => {
          throw new Error("relay: stub");
        },
        cmd: () => {
          throw new Error("cmd: stub");
        },
      },
      userFactory: async (_plugin, cursor) => ({
        doubled: (cursor as { cell: (...a: unknown[]) => unknown }).cell(() => upstream.read().count * 2),
      }),
    });

    const resource = (await resolve(matrix)) as { doubled: number };

    expect(resource.doubled).toBe(10);

    // Cache hit: outer cassette should pick up the memo cell only.
    const outer = recorder.createCassette();
    outer.insert();
    expect(resource.doubled).toBe(10);
    outer.eject();
    expect(outer.getDeps().size).toBe(1);
    expect(outer.getDeps()).not.toContain(upstream);
  });
});
