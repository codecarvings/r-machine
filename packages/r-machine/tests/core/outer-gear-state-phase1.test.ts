import { describe, expect, it, vi } from "vitest";
import { _buildStatefulOuterGearCursor, _stateCellSlot } from "../../src/core/outer-gear-composer.js";
import { insertCassette } from "../../src/core/reactivity/cassette-recorder.js";
import { createStateCell, type StateCell } from "../../src/core/reactivity/state-cell.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import { createResMatrix } from "../../src/core/res-matrix.js";

// --- helpers -----------------------------------------------------------------

// The public ResMatrix.factory is typed as `() => Promise<R>` but the actual
// implementation expects (locale, chain). For phase-1 tests we bypass the
// blueprint stack and invoke the resolution directly, so we need the wider
// signature.
type InternalFactoryCall = (locale: undefined, chain: never[]) => Promise<unknown>;
function resolve(matrix: { factory: () => Promise<unknown> }): Promise<unknown> {
  return (matrix.factory as unknown as InternalFactoryCall)(undefined, []);
}

// Mock connector that wires a fresh ctx ($) through the augmentCtx pipeline
// — the same path createResMatrix uses in production via JunctureManager.
function makeConnector(): ResComposerConnector {
  return {
    getWire: async (_nsDeps: unknown, _locale: unknown, buildCtx: (ctx: unknown) => void, _chain: unknown) => {
      const $: Record<string, unknown> = {};
      buildCtx($);
      return { plugin: $ };
    },
  } as unknown as ResComposerConnector;
}

interface ShoppingCartState {
  readonly items: ReadonlyArray<{ readonly price: number }>;
}

// Build a stateful OuterGear-shaped matrix via createResMatrix directly. This
// exercises the same wiring outer-gear-composer.ts uses for the Map/List
// variants but with minimal head/deps shape — phase 1 doesn't need the
// blueprint stack to validate the reactive runtime.
function buildStatefulMatrix<S>(
  defaultState: S,
  userFactory: (
    $: { state: S; defaultState: S },
    cursor: ReturnType<typeof _buildStatefulOuterGearCursor<S>>
  ) => unknown
) {
  return createResMatrix({
    connector: makeConnector(),
    meta: { family: "gear", role: "outer" },
    head: { realm: "res", family: "gear", mode: "map", deps: [], nsDeps: [], nsDepList: [], ports: {} } as never,
    cursor: (plugin: unknown) =>
      _buildStatefulOuterGearCursor<S>((plugin as { [_stateCellSlot]: StateCell<S> })[_stateCellSlot]),
    userFactory: async (plugin, cursor) =>
      userFactory(
        plugin as { state: S; defaultState: S },
        cursor as ReturnType<typeof _buildStatefulOuterGearCursor<S>>
      ),
    augmentCtx: ($) => {
      const cell = createStateCell(defaultState);
      ($ as unknown as { [_stateCellSlot]: StateCell<S> })[_stateCellSlot] = cell;
      Object.defineProperty($, "state", { get: () => cell.read(), enumerable: true });
      $.defaultState = defaultState;
    },
  });
}

// --- tests -------------------------------------------------------------------

describe("OuterGear state — phase 1 end-to-end", () => {
  it("$.state inside the user factory is reactive: cassette opened by consumer captures the state cell", async () => {
    const matrix = buildStatefulMatrix({ count: 0 }, ($, cursor) => ({
      read: cursor.getter(() => $.state.count),
    }));

    const resource = (await resolve(matrix)) as { read: () => number };

    const handle = insertCassette();
    const value = resource.read();
    handle.eject();

    expect(value).toBe(0);
    // The cassette saw a read of the underlying StateCell — proving augmentCtx
    // installed the tracked getter on $.state.
    expect(handle.cassette.getDeps().size).toBe(1);
  });

  it("memoized getter via cursor.getter('memoized', ...) registers itself (not transitive deps) on cache hit", async () => {
    const matrix = buildStatefulMatrix<ShoppingCartState>({ items: [{ price: 10 }, { price: 20 }] }, ($, cursor) => ({
      subtotal: cursor.getter("memoized", () => $.state.items.reduce((s, i) => s + i.price, 0)),
    }));

    const resource = (await resolve(matrix)) as { subtotal: () => number };

    // First call: cache miss — outer cassette accumulates transitive deps.
    const first = insertCassette();
    expect(resource.subtotal()).toBe(30);
    first.eject();
    const firstDeps = first.cassette.getDeps().size;

    // Second call: cache hit — outer cassette receives only the memo cell.
    const second = insertCassette();
    expect(resource.subtotal()).toBe(30);
    second.eject();
    expect(second.cassette.getDeps().size).toBe(1);
    expect(second.cassette.getDeps().size).toBeLessThan(firstDeps);
  });

  it("action publishes new state; consumer subscribers fire; equality short-circuit prevents memo notify on unchanged output", async () => {
    interface State {
      items: ReadonlyArray<{ price: number }>;
      other: number;
    }
    const matrix = buildStatefulMatrix<State>({ items: [{ price: 10 }, { price: 20 }], other: 0 }, ($, cursor) => ({
      subtotal: cursor.getter("memoized", () => $.state.items.reduce((s, i) => s + i.price, 0)),
      setItems: cursor.action((items: { price: number }[]) => ({ items })),
      setOther: cursor.action((n: number) => ({ other: n })),
    }));

    const resource = (await resolve(matrix)) as {
      subtotal: () => number;
      setItems: (items: { price: number }[]) => unknown;
      setOther: (n: number) => unknown;
    };

    // Prime the memo and subscribe.
    expect(resource.subtotal()).toBe(30);
    const second = insertCassette();
    resource.subtotal();
    second.eject();
    const memoCell = [...second.cassette.getDeps()][0]!;
    const memoSub = vi.fn();
    memoCell.subscribe(memoSub);

    // Mutate `other`: items unchanged → subtotal stays 30 → memo doesn't notify.
    resource.setOther(99);
    expect(memoSub).not.toHaveBeenCalled();

    // Mutate items but preserve total: 30 → 30 → memo doesn't notify.
    resource.setItems([{ price: 15 }, { price: 15 }]);
    expect(memoSub).not.toHaveBeenCalled();

    // Mutate items to change total: 30 → 10 → memo notifies once.
    resource.setItems([{ price: 5 }, { price: 5 }]);
    expect(memoSub).toHaveBeenCalledTimes(1);
    expect(resource.subtotal()).toBe(10);
  });

  it("two OuterGear instances have independent state cells: action on one does not affect the other's subscribers", async () => {
    const cartMatrix = buildStatefulMatrix({ items: [1, 2, 3] }, ($, cursor) => ({
      read: cursor.getter(() => $.state.items),
      setItems: cursor.action((items: number[]) => ({ items })),
    }));
    const otherMatrix = buildStatefulMatrix({ items: [9, 9] }, ($, cursor) => ({
      read: cursor.getter(() => $.state.items),
      setItems: cursor.action((items: number[]) => ({ items })),
    }));

    const cart = (await resolve(cartMatrix)) as {
      read: () => number[];
      setItems: (items: number[]) => unknown;
    };
    const other = (await resolve(otherMatrix)) as {
      read: () => number[];
      setItems: (items: number[]) => unknown;
    };

    // Subscribe via cassette to each gear's state cell.
    const cartHandle = insertCassette();
    cart.read();
    cartHandle.eject();
    const cartCell = [...cartHandle.cassette.getDeps()][0]!;
    const cartSub = vi.fn();
    cartCell.subscribe(cartSub);

    const otherHandle = insertCassette();
    other.read();
    otherHandle.eject();
    const otherCell = [...otherHandle.cassette.getDeps()][0]!;
    const otherSub = vi.fn();
    otherCell.subscribe(otherSub);

    // Mutate cart only.
    cart.setItems([10, 20]);

    expect(cartSub).toHaveBeenCalledTimes(1);
    expect(otherSub).not.toHaveBeenCalled();
  });
});
