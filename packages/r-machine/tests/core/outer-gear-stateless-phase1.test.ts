import { describe, expect, it, vi } from "vitest";
import { _buildStatelessGetterComposer } from "../../src/core/outer-gear-composer.js";
import { insertCassette } from "../../src/core/reactivity/cassette-recorder.js";
import { createStateCell } from "../../src/core/reactivity/state-cell.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import { createResMatrix } from "../../src/core/res-matrix.js";

// --- helpers -----------------------------------------------------------------

type InternalFactoryCall = (locale: undefined, chain: never[]) => Promise<unknown>;
function resolve(matrix: { factory: () => Promise<unknown> }): Promise<unknown> {
  return (matrix.factory as unknown as InternalFactoryCall)(undefined, []);
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

describe("_buildStatelessGetterComposer", () => {
  it("getter(body) returns the body function as the Getter (no memoization)", () => {
    const composer = _buildStatelessGetterComposer();
    const body = () => 42;
    const g = composer(body);
    expect(g()).toBe(42);
    expect(g).toBe(body);
  });

  it("getter('memoized', body) returns a memoized thunk backed by a MemoCell", () => {
    const composer = _buildStatelessGetterComposer();
    const body = vi.fn(() => 7);
    const g = composer("memoized", body);

    expect(g()).toBe(7);
    expect(g()).toBe(7);
    // Cache hit on the second call — body invoked exactly once.
    expect(body).toHaveBeenCalledTimes(1);
  });

  it("memoized getter participates in cassette tracking like the stateful counterpart", () => {
    const composer = _buildStatelessGetterComposer();
    const upstream = createStateCell({ v: 1 });
    const g = composer("memoized", () => upstream.read().v * 10);

    // Prime so the next call is a cache hit.
    g();

    const outer = insertCassette();
    g();
    outer.eject();

    // Cache hit registers the memo cell only (not the upstream cell).
    expect(outer.cassette.getDeps().size).toBe(1);
    expect(outer.cassette.getDeps()).not.toContain(upstream);
  });

  it("throws on invalid arguments shape", () => {
    const composer = _buildStatelessGetterComposer() as unknown as (...a: unknown[]) => unknown;
    expect(() => composer()).toThrow(/invalid arguments/);
    expect(() => composer("not-memoized", () => 1)).toThrow(/invalid arguments/);
    expect(() => composer(42)).toThrow(/invalid arguments/);
  });
});

// --- integration via createResMatrix ----------------------------------------

describe("Stateless OuterGear — end-to-end via createResMatrix", () => {
  it("user-factory can declare a memoized getter on a stateless gear and it tracks deps via cassettes", async () => {
    // Build an external state cell to act as the gear's dependency surface — the
    // stateless gear's factory closes over it directly. In production this is
    // what `plugin.<depName>` would expose; here we wire it manually.
    const upstream = createStateCell({ count: 5 });

    const matrix = createResMatrix({
      connector: makeConnector(),
      meta: { family: "gear", role: "outer" },
      head: { realm: "res", family: "gear", mode: "map", deps: [], nsDeps: [], nsDepList: [], ports: {} } as never,
      cursor: {
        getter: _buildStatelessGetterComposer(),
        relay: () => {
          throw new Error("relay: stub");
        },
        cmd: () => {
          throw new Error("cmd: stub");
        },
      },
      userFactory: async (_plugin, cursor) => ({
        doubled: (cursor as { getter: (...a: unknown[]) => unknown }).getter(
          "memoized",
          () => upstream.read().count * 2
        ),
      }),
    });

    const resource = (await resolve(matrix)) as { doubled: () => number };

    expect(resource.doubled()).toBe(10);

    // Cache hit: outer cassette should pick up the memo cell only.
    const outer = insertCassette();
    expect(resource.doubled()).toBe(10);
    outer.eject();
    expect(outer.cassette.getDeps().size).toBe(1);
    expect(outer.cassette.getDeps()).not.toContain(upstream);
  });
});
