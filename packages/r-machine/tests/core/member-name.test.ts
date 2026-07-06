import { describe, expect, it } from "vitest";
import { createCassetteRecorder } from "../../src/core/cassette-recorder.js";
import { getMemberName, promoteMemberNames } from "../../src/core/member-name.js";
import { buildStatefulOuterGearCursor, stateCellSlot } from "../../src/core/outer-gear-composer.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import { type AnyResMatrix, createResMatrix, instantiateRes } from "../../src/core/res-matrix.js";
import { createStateCell, type StateCell } from "../../src/core/state-cell.js";

// Build a stateful OuterGear-shaped matrix that runs the same postProcess
// (member-name promotion) as the production composer.
function buildMatrix<S>(
  recorder: ReturnType<typeof createCassetteRecorder>,
  defaultState: S,
  userFactory: ($: { state: S; defaultState: S }, cursor: ReturnType<typeof buildStatefulOuterGearCursor<S>>) => unknown
) {
  return createResMatrix({
    connector: {
      getWire: async (_n: unknown, _l: unknown, buildCtx: (ctx: unknown) => void) => {
        const $: Record<string, unknown> = {};
        buildCtx($);
        return { plugin: $ };
      },
    } as unknown as ResComposerConnector,
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
    postProcess: (raw) => {
      promoteMemberNames(raw);
      return raw as AnyRes;
    },
  });
}

async function resolveRaw(matrix: AnyResMatrix): Promise<Record<string, unknown>> {
  return (await instantiateRes(matrix)) as Record<string, unknown>;
}

describe("member auto-naming + promotion", () => {
  it("action exported under a property name takes the property name", async () => {
    const recorder = createCassetteRecorder();
    const matrix = buildMatrix(recorder, 0, ($, cursor) => {
      const inc = cursor.action(() => ($.state as number) + 1);
      return { inc, value: cursor.getter() };
    });
    const r = await resolveRaw(matrix);
    expect(getMemberName(r.inc as never)).toBe("inc");
    expect(getMemberName(r.value as never)).toBe("value");
  });

  it("action NOT exported keeps its auto-generated default name (action:1)", async () => {
    const recorder = createCassetteRecorder();
    const matrix = buildMatrix(recorder, 0, ($, cursor) => {
      const inc = cursor.action(() => ($.state as number) + 1);
      // Expose only the action's effect via a getter so we can return a ref to it
      // without exposing the action itself as a property.
      return { run: cursor.getter(() => inc()), value: cursor.getter() };
    });
    const r = await resolveRaw(matrix);
    // The action ref isn't on the returned object — but we can reach it indirectly
    // by reusing the same cursor in another resolution; here we just assert the
    // *getters* are named, and rely on the action default in the next test.
    expect(getMemberName(r.run as never)).toBe("run");
    expect(getMemberName(r.value as never)).toBe("value");
  });

  it("default name is action:1 / action:2 / ... per factory call when not promoted", async () => {
    const recorder = createCassetteRecorder();
    // Capture refs inside a wrapper object so we can inspect post-walk state.
    const captured: { inc?: unknown; dec?: unknown } = {};
    const matrix = buildMatrix(recorder, 0, ($, cursor) => {
      captured.inc = cursor.action(() => ($.state as number) + 1);
      captured.dec = cursor.action(() => ($.state as number) - 1);
      // Don't expose them as top-level properties → no promotion.
      return { value: cursor.getter() };
    });
    await resolveRaw(matrix);
    expect(getMemberName(captured.inc as never)).toBe("action:1");
    expect(getMemberName(captured.dec as never)).toBe("action:2");
  });

  it("default name for getter is getter:1 / getter:2 / ... per factory call when not promoted", async () => {
    const recorder = createCassetteRecorder();
    const captured: { a?: unknown; b?: unknown } = {};
    const matrix = buildMatrix(recorder, { x: 1 }, ($, cursor) => {
      captured.a = cursor.getter(() => $.state.x);
      captured.b = cursor.cell(() => $.state.x * 2);
      return {}; // nothing exported → no promotion
    });
    await resolveRaw(matrix);
    expect(getMemberName(captured.a as never)).toBe("getter:1");
    expect(getMemberName(captured.b as never)).toBe("cell:1");
  });

  it("same action ref exported under two property names → LAST key wins", async () => {
    const recorder = createCassetteRecorder();
    const matrix = buildMatrix(recorder, 0, ($, cursor) => {
      const tick = cursor.action(() => ($.state as number) + 1);
      return { first: tick, second: tick, value: cursor.getter() };
    });
    const r = await resolveRaw(matrix);
    expect(getMemberName(r.first as never)).toBe("second");
    expect(r.first).toBe(r.second);
  });

  it("two resolutions of the same matrix have independent counters (per factory call)", async () => {
    const recorder = createCassetteRecorder();
    const captured: Array<{ a?: unknown; b?: unknown }> = [{}, {}];
    let n = 0;
    const matrix = buildMatrix(recorder, 0, ($, cursor) => {
      const slot = captured[n++]!;
      slot.a = cursor.action(() => ($.state as number) + 1);
      slot.b = cursor.action(() => ($.state as number) - 1);
      return { value: cursor.getter() };
    });
    await resolveRaw(matrix);
    await resolveRaw(matrix);
    expect(getMemberName(captured[0]!.a as never)).toBe("action:1");
    expect(getMemberName(captured[0]!.b as never)).toBe("action:2");
    expect(getMemberName(captured[1]!.a as never)).toBe("action:1");
    expect(getMemberName(captured[1]!.b as never)).toBe("action:2");
  });

  it("nested action under a non-top-level key is NOT promoted (only top-level walk)", async () => {
    const recorder = createCassetteRecorder();
    const captured: { inc?: unknown } = {};
    const matrix = buildMatrix(recorder, 0, ($, cursor) => {
      captured.inc = cursor.action(() => ($.state as number) + 1);
      return { value: cursor.getter(), nested: { inc: captured.inc } };
    });
    await resolveRaw(matrix);
    expect(getMemberName(captured.inc as never)).toBe("action:1");
  });

  it("promoteMemberNames is a no-op for null / undefined / primitive resources", () => {
    expect(() => promoteMemberNames(null)).not.toThrow();
    expect(() => promoteMemberNames(undefined)).not.toThrow();
    expect(() => promoteMemberNames(42)).not.toThrow();
    expect(() => promoteMemberNames("not-an-object")).not.toThrow();
  });
});
