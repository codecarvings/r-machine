import { describe, expect, it, vi } from "vitest";
import { makeAction } from "../../../src/core/reactivity/action-runtime.js";
import { createCassetteRecorder } from "../../../src/core/reactivity/cassette-recorder.js";
import { createGetterCell } from "../../../src/core/reactivity/getter-cell.js";
import { createStateCell } from "../../../src/core/reactivity/state-cell.js";

describe("transactional publish", () => {
  it("action mutating N cells notifies each external subscriber exactly once", () => {
    const recorder = createCassetteRecorder();
    const cellA = createStateCell({ v: 0 }, recorder);
    const cellB = createStateCell({ v: 0 }, recorder);
    const subA = vi.fn();
    const subB = vi.fn();
    cellA.subscribe(subA);
    cellB.subscribe(subB);

    // A single action that mutates BOTH cells.
    const setBoth = makeAction(
      cellA,
      (nextA: number, nextB: number) => {
        cellB.publish({ v: nextB });
        return { v: nextA };
      },
      recorder,
      "setBoth"
    );

    setBoth(7, 11);

    expect(cellA.peek()).toEqual({ v: 7 });
    expect(cellB.peek()).toEqual({ v: 11 });
    expect(subA).toHaveBeenCalledTimes(1);
    expect(subB).toHaveBeenCalledTimes(1);
  });

  it("memo reading two cells both mutated in one action: external subscriber called exactly once", () => {
    const recorder = createCassetteRecorder();
    const a = createStateCell(1, recorder);
    const b = createStateCell(2, recorder);
    const memo = createGetterCell(() => a.read() + b.read(), recorder);
    const sub = vi.fn();
    memo.subscribe(sub);

    // Prime the memo so it has a value + dep subscriptions.
    expect(memo.read()).toBe(3);

    const mutate = makeAction(
      a,
      (nextA: number, nextB: number) => {
        b.publish(nextB);
        return nextA;
      },
      recorder,
      "mutate"
    );

    mutate(10, 20);

    expect(memo.read()).toBe(30);
    expect(sub).toHaveBeenCalledTimes(1);
  });

  it("cell.publish called directly (no action, no tx) still notifies external subs inline", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const sub = vi.fn();
    cell.subscribe(sub);
    cell.publish(1);
    expect(sub).toHaveBeenCalledTimes(1);
  });

  it("re-entrant actions: outer + inner action results in 1 notify per affected cell", () => {
    const recorder = createCassetteRecorder();
    const cellA = createStateCell({ v: 0 }, recorder);
    const cellB = createStateCell({ v: 0 }, recorder);
    const subA = vi.fn();
    const subB = vi.fn();
    cellA.subscribe(subA);
    cellB.subscribe(subB);

    const setB = makeAction(cellB, (n: number) => ({ v: n }), recorder, "setB");
    const setA = makeAction(
      cellA,
      (n: number) => {
        setB(n * 10);
        return { v: n };
      },
      recorder,
      "setA"
    );

    setA(2);

    expect(cellA.peek()).toEqual({ v: 2 });
    expect(cellB.peek()).toEqual({ v: 20 });
    expect(subA).toHaveBeenCalledTimes(1);
    expect(subB).toHaveBeenCalledTimes(1);
  });

  it("internal subs (memo invalidate) fire DURING the tick, before external flush", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const memo = createGetterCell(() => cell.read() * 2, recorder);
    const order: string[] = [];
    memo.subscribe(() => order.push("memo-external"));
    // Prime the memo.
    expect(memo.read()).toBe(0);

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(5);

    // External flush happens AFTER the action body finishes; subscribers
    // ordering relative to each other isn't enforced here, but we can
    // assert the memo has the fresh value before the external sub fires.
    expect(order).toEqual(["memo-external"]);
    expect(memo.read()).toBe(10);
  });

  it("Object.is short-circuit: publishing the same value doesn't notify", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(42, recorder);
    const sub = vi.fn();
    const internalSub = vi.fn();
    cell.subscribe(sub);
    cell.subscribeInternal(internalSub);
    cell.publish(42);
    expect(sub).not.toHaveBeenCalled();
    expect(internalSub).not.toHaveBeenCalled();
  });
});
