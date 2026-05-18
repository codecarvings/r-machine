import { describe, expect, it, vi } from "vitest";
import { makeAction } from "../../../src/core/reactivity/action-runtime.js";
import { createCassetteRecorder } from "../../../src/core/reactivity/cassette-recorder.js";
import { createStateCell } from "../../../src/core/reactivity/state-cell.js";

describe("makeAction", () => {
  it("merges a partial into current state and publishes", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ a: 1, b: 2 }, recorder);
    const sub = vi.fn();
    cell.subscribe(sub);

    const setA = makeAction(cell, (next: number) => ({ a: next }), recorder, "setA");
    const result = setA(9);

    expect(result).toEqual({ a: 9, b: 2 });
    expect(cell.peek()).toEqual({ a: 9, b: 2 });
    expect(sub).toHaveBeenCalledTimes(1);
  });

  it("does NOT publish when the deep-merged result is the same reference as prev (structural sharing)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ a: 1, b: 2 }, recorder);
    const sub = vi.fn();
    cell.subscribe(sub);

    // Partial that produces no leaf change → deepPartialMerge returns prev by reference.
    const noop = makeAction(cell, () => ({ a: 1 }), recorder, "noop");
    noop();

    expect(sub).not.toHaveBeenCalled();
    expect(cell.peek()).toEqual({ a: 1, b: 2 });
  });

  it("short-circuits before merging when the reducer returns prev by reference", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ a: 1, b: 2 }, recorder);
    const sub = vi.fn();
    cell.subscribe(sub);

    const identity = makeAction(cell, () => cell.peek(), recorder, "identity");
    const result = identity();

    expect(result).toBe(cell.peek());
    expect(sub).not.toHaveBeenCalled();
  });

  it("reads inside the reducer body do NOT leak into outer cassettes (silent zone)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ a: 1 }, recorder);
    const incr = makeAction(cell, () => ({ a: cell.peek().a + 1 }), recorder, "incr");

    const outer = recorder.createCassette();
    outer.insert();
    incr();
    outer.eject();

    expect(outer.getDeps()).not.toContain(cell);
    expect(cell.peek()).toEqual({ a: 2 });
  });

  it("re-entrance: action calls action — both publish independently, neither leaks reads", () => {
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

    const outer = recorder.createCassette();
    outer.insert();
    setA(2);
    outer.eject();

    expect(cellA.peek()).toEqual({ v: 2 });
    expect(cellB.peek()).toEqual({ v: 20 });
    expect(subA).toHaveBeenCalledTimes(1);
    expect(subB).toHaveBeenCalledTimes(1);
    expect(outer.getDeps()).not.toContain(cellA);
    expect(outer.getDeps()).not.toContain(cellB);
  });
});
