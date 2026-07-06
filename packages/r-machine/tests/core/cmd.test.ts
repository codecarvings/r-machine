import { describe, expect, it } from "vitest";
import { createCassetteRecorder } from "../../src/core/cassette-recorder.js";
import { isCmd } from "../../src/core/cmd.js";
import { promoteMemberNames } from "../../src/core/member-name.js";
import { buildStatefulOuterGearCursor, stateCellSlot } from "../../src/core/outer-gear-composer.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import { type AnyResMatrix, createResMatrix, instantiateRes } from "../../src/core/res-matrix.js";
import { createStateCell, type StateCell } from "../../src/core/state-cell.js";

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

async function resolve(matrix: AnyResMatrix): Promise<Record<string, unknown>> {
  return (await instantiateRes(matrix)) as Record<string, unknown>;
}

describe("_.cmd composer", () => {
  it("builds a Cmd object branding the target action and its payload", async () => {
    const recorder = createCassetteRecorder();
    const captured: { cmd?: unknown; setItems?: unknown } = {};
    const matrix = buildMatrix(recorder, { items: [] as number[] }, ($, cursor) => {
      const setItems = cursor.action((items: number[]) => ({ items }));
      captured.setItems = setItems;
      captured.cmd = cursor.cmd(setItems, [1, 2, 3]);
      return { value: cursor.getter(() => $.state.items), setItems };
    });
    await resolve(matrix);

    const cmd = captured.cmd;
    expect(isCmd(cmd)).toBe(true);
    expect((cmd as { action: unknown }).action).toBe(captured.setItems);
    expect((cmd as { payload: unknown[] }).payload).toEqual([[1, 2, 3]]);
  });

  it("zero-arg action: cmd payload is an empty tuple", async () => {
    const recorder = createCassetteRecorder();
    const captured: { cmd?: unknown } = {};
    const matrix = buildMatrix(recorder, 0, ($, cursor) => {
      const tick = cursor.action(() => ($.state as number) + 1);
      captured.cmd = cursor.cmd(tick);
      return { value: cursor.getter() };
    });
    await resolve(matrix);

    expect(isCmd(captured.cmd)).toBe(true);
    expect((captured.cmd as { payload: unknown[] }).payload).toEqual([]);
  });

  it("multiple cmds against the same action are independent objects but share the action ref", async () => {
    const recorder = createCassetteRecorder();
    const captured: { a?: unknown; b?: unknown; action?: unknown } = {};
    const matrix = buildMatrix(recorder, 0, (_$, cursor) => {
      const set = cursor.action((n: number) => n);
      captured.action = set;
      captured.a = cursor.cmd(set, 1);
      captured.b = cursor.cmd(set, 2);
      return { value: cursor.getter() };
    });
    await resolve(matrix);

    expect(captured.a).not.toBe(captured.b);
    expect((captured.a as { action: unknown }).action).toBe(captured.action);
    expect((captured.b as { action: unknown }).action).toBe(captured.action);
    expect((captured.a as { payload: unknown[] }).payload).toEqual([1]);
    expect((captured.b as { payload: unknown[] }).payload).toEqual([2]);
  });

  it("isCmd returns false for plain objects, functions, and null", () => {
    expect(isCmd({})).toBe(false);
    expect(isCmd({ action: () => 0, payload: [] })).toBe(false);
    expect(isCmd(() => 0)).toBe(false);
    expect(isCmd(null)).toBe(false);
    expect(isCmd(undefined)).toBe(false);
  });
});
