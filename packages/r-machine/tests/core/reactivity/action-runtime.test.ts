import { describe, expect, it, vi } from "vitest";
import { makeAction } from "../../../src/core/reactivity/action-runtime.js";
import { insertCassette } from "../../../src/core/reactivity/cassette-recorder.js";
import { createStateCell } from "../../../src/core/reactivity/state-cell.js";

describe("makeAction", () => {
  it("merges a partial into current state and publishes", () => {
    const cell = createStateCell({ a: 1, b: 2 });
    const sub = vi.fn();
    cell.subscribe(sub);

    const setA = makeAction(cell, (next: number) => ({ a: next }));
    const result = setA(9);

    expect(result).toEqual({ a: 9, b: 2 });
    expect(cell.peek()).toEqual({ a: 9, b: 2 });
    expect(sub).toHaveBeenCalledTimes(1);
  });

  it("does NOT publish when the deep-merged result is the same reference as prev (structural sharing)", () => {
    const cell = createStateCell({ a: 1, b: 2 });
    const sub = vi.fn();
    cell.subscribe(sub);

    // Partial that produces no leaf change → deepPartialMerge returns prev by reference.
    const noop = makeAction(cell, () => ({ a: 1 }));
    noop();

    expect(sub).not.toHaveBeenCalled();
    expect(cell.peek()).toEqual({ a: 1, b: 2 });
  });

  it("short-circuits before merging when the reducer returns prev by reference", () => {
    const cell = createStateCell({ a: 1, b: 2 });
    const sub = vi.fn();
    cell.subscribe(sub);

    const identity = makeAction(cell, () => cell.peek());
    const result = identity();

    expect(result).toBe(cell.peek());
    expect(sub).not.toHaveBeenCalled();
  });

  it("reads inside the reducer body do NOT leak into outer cassettes (silent zone)", () => {
    const cell = createStateCell({ a: 1 });
    const incr = makeAction(cell, () => ({ a: cell.peek().a + 1 }));

    const outer = insertCassette();
    incr();
    outer.eject();

    expect(outer.cassette.getDeps()).not.toContain(cell);
    expect(cell.peek()).toEqual({ a: 2 });
  });

  it("re-entrance: action calls action — both publish independently, neither leaks reads", () => {
    const cellA = createStateCell({ v: 0 });
    const cellB = createStateCell({ v: 0 });
    const subA = vi.fn();
    const subB = vi.fn();
    cellA.subscribe(subA);
    cellB.subscribe(subB);

    const setB = makeAction(cellB, (n: number) => ({ v: n }));
    const setA = makeAction(cellA, (n: number) => {
      setB(n * 10);
      return { v: n };
    });

    const outer = insertCassette();
    setA(2);
    outer.eject();

    expect(cellA.peek()).toEqual({ v: 2 });
    expect(cellB.peek()).toEqual({ v: 20 });
    expect(subA).toHaveBeenCalledTimes(1);
    expect(subB).toHaveBeenCalledTimes(1);
    expect(outer.cassette.getDeps()).not.toContain(cellA);
    expect(outer.cassette.getDeps()).not.toContain(cellB);
  });
});
