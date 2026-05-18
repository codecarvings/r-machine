import { describe, expect, it, vi } from "vitest";
import { buildKernelJuncture } from "../../src/core/juncture.js";
import { buildStatefulOuterGearCursor, stateCellSlot } from "../../src/core/outer-gear-composer.js";
import { createCassetteRecorder } from "../../src/core/reactivity/cassette-recorder.js";
import { createStateCell, type StateCell } from "../../src/core/reactivity/state-cell.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import { createResMatrix } from "../../src/core/res-matrix.js";

// --- helpers -----------------------------------------------------------------

// The public ResMatrix.factory is typed as `() => Promise<R>` but the actual
// implementation expects (locale, chain). For phase-1 tests we bypass the
// blueprint stack and invoke the resolution directly, so we need the wider
// signature. We also wrap the raw resource in a kernel juncture so getter specs
// are materialized as JS accessors (matching what consumers see in production).
type InternalFactoryCall = (locale: undefined, chain: never[]) => Promise<unknown>;
async function resolve(matrix: { factory: () => Promise<unknown> }): Promise<unknown> {
  const raw = await (matrix.factory as unknown as InternalFactoryCall)(undefined, []);
  return buildKernelJuncture(raw as AnyRes, undefined).surface;
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
  recorder: ReturnType<typeof createCassetteRecorder>,
  defaultState: S,
  userFactory: ($: { state: S; defaultState: S }, cursor: ReturnType<typeof buildStatefulOuterGearCursor<S>>) => unknown
) {
  return createResMatrix({
    connector: makeConnector(),
    meta: { family: "gear", role: "outer" },
    head: { realm: "res", family: "gear", mode: "map", deps: [], nsDeps: [], nsDepList: [], ports: {} } as never,
    cursor: (plugin: unknown) =>
      buildStatefulOuterGearCursor<S>((plugin as { [stateCellSlot]: StateCell<S> })[stateCellSlot], recorder),
    userFactory: async (plugin, cursor) =>
      userFactory(
        plugin as { state: S; defaultState: S },
        cursor as ReturnType<typeof buildStatefulOuterGearCursor<S>>
      ),
    augmentCtx: ($) => {
      const cell = createStateCell(defaultState, recorder);
      ($ as unknown as { [stateCellSlot]: StateCell<S> })[stateCellSlot] = cell;
      Object.defineProperty($, "state", { get: () => cell.read(), enumerable: true });
      $.defaultState = defaultState;
    },
  });
}

// --- tests -------------------------------------------------------------------

describe("OuterGear state — phase 1 end-to-end", () => {
  it("$.state inside the user factory is reactive: cassette opened by consumer captures the state cell", async () => {
    const recorder = createCassetteRecorder();
    const matrix = buildStatefulMatrix(recorder, { count: 0 }, ($, cursor) => ({
      read: cursor.getter(() => $.state.count),
    }));

    const resource = (await resolve(matrix)) as { read: number };

    const handle = recorder.createCassette();
    handle.insert();
    const value = resource.read;
    handle.eject();

    expect(value).toBe(0);
    // The cassette saw a read of the underlying StateCell — proving augmentCtx
    // installed the tracked getter on $.state.
    expect(handle.getDeps().size).toBe(1);
  });

  it("memoized getter via cursor.getter('memoized', ...) registers itself (not transitive deps) on cache hit", async () => {
    const recorder = createCassetteRecorder();
    const matrix = buildStatefulMatrix<ShoppingCartState>(
      recorder,
      { items: [{ price: 10 }, { price: 20 }] },
      ($, cursor) => ({
        subtotal: cursor.getter("memoized", () => $.state.items.reduce((s, i) => s + i.price, 0)),
      })
    );

    const resource = (await resolve(matrix)) as { subtotal: number };

    // Under top-of-stack scoping, both cache miss and cache hit produce the
    // same outer deps: only the memo cell itself. The memo's private cassette
    // holds the transitive deps (where they belong for proper invalidation).
    const first = recorder.createCassette();
    first.insert();
    expect(resource.subtotal).toBe(30);
    first.eject();
    expect(first.getDeps().size).toBe(1);

    const second = recorder.createCassette();
    second.insert();
    expect(resource.subtotal).toBe(30);
    second.eject();
    expect(second.getDeps().size).toBe(1);
  });

  it("action publishes new state; consumer subscribers fire; equality short-circuit prevents memo notify on unchanged output", async () => {
    interface State {
      items: ReadonlyArray<{ price: number }>;
      other: number;
    }
    const recorder = createCassetteRecorder();
    const matrix = buildStatefulMatrix<State>(
      recorder,
      { items: [{ price: 10 }, { price: 20 }], other: 0 },
      ($, cursor) => ({
        subtotal: cursor.getter("memoized", () => $.state.items.reduce((s, i) => s + i.price, 0)),
        setItems: cursor.action((items: { price: number }[]) => ({ items })),
        setOther: cursor.action((n: number) => ({ other: n })),
      })
    );

    const resource = (await resolve(matrix)) as {
      subtotal: number;
      setItems: (items: { price: number }[]) => unknown;
      setOther: (n: number) => unknown;
    };

    // Prime the memo and subscribe.
    expect(resource.subtotal).toBe(30);
    const second = recorder.createCassette();
    second.insert();
    void resource.subtotal;
    second.eject();
    const memoCell = [...second.getDeps()][0]!;
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
    expect(resource.subtotal).toBe(10);
  });

  it("two OuterGear instances have independent state cells: action on one does not affect the other's subscribers", async () => {
    const recorder = createCassetteRecorder();
    const cartMatrix = buildStatefulMatrix(recorder, { items: [1, 2, 3] }, ($, cursor) => ({
      read: cursor.getter(() => $.state.items),
      setItems: cursor.action((items: number[]) => ({ items })),
    }));
    const otherMatrix = buildStatefulMatrix(recorder, { items: [9, 9] }, ($, cursor) => ({
      read: cursor.getter(() => $.state.items),
      setItems: cursor.action((items: number[]) => ({ items })),
    }));

    const cart = (await resolve(cartMatrix)) as {
      read: number[];
      setItems: (items: number[]) => unknown;
    };
    const other = (await resolve(otherMatrix)) as {
      read: number[];
      setItems: (items: number[]) => unknown;
    };

    // Subscribe via cassette to each gear's state cell.
    const cartHandle = recorder.createCassette();
    cartHandle.insert();
    void cart.read;
    cartHandle.eject();
    const cartCell = [...cartHandle.getDeps()][0]!;
    const cartSub = vi.fn();
    cartCell.subscribe(cartSub);

    const otherHandle = recorder.createCassette();
    otherHandle.insert();
    void other.read;
    otherHandle.eject();
    const otherCell = [...otherHandle.getDeps()][0]!;
    const otherSub = vi.fn();
    otherCell.subscribe(otherSub);

    // Mutate cart only.
    cart.setItems([10, 20]);

    expect(cartSub).toHaveBeenCalledTimes(1);
    expect(otherSub).not.toHaveBeenCalled();
  });
});
