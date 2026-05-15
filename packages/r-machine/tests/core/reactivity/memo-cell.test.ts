import { describe, expect, it, vi } from "vitest";
import { makeAction } from "../../../src/core/reactivity/action-runtime.js";
import { createCassetteRecorder } from "../../../src/core/reactivity/cassette-recorder.js";
import { createMemoCell } from "../../../src/core/reactivity/memo-cell.js";
import { createStateCell } from "../../../src/core/reactivity/state-cell.js";

describe("createMemoCell", () => {
  it("cache miss: the memo's private cassette captures transitive deps; outer captures only the memo", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3] }, recorder);
    const count = createMemoCell(() => cell.read().items.length, recorder);

    const outer = recorder.createCassette();
    outer.insert();
    count.read();
    outer.eject();

    // Top-of-stack scoping: during the memo body, its private cassette is
    // on top → only the memo captures `cell`. After the body, the memo's
    // private cassette pops and the outer (now top) captures only the memo
    // itself. Reactivity is preserved: when `cell` mutates, the memo
    // invalidates and (if its output changed) notifies its subscribers —
    // which include the outer's commit-time subscription.
    expect(outer.getDeps()).not.toContain(cell);
    expect(outer.getDeps()).toContain(count);
  });

  it("cache hit registers ONLY the memo cell (not transitive deps) in the outer cassette", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3] }, recorder);
    const count = createMemoCell(() => cell.read().items.length, recorder);

    // Prime the memo so the next read is a cache hit.
    count.read();

    const outer = recorder.createCassette();
    outer.insert();
    count.read();
    outer.eject();

    expect(outer.getDeps()).toContain(count);
    expect(outer.getDeps()).not.toContain(cell);
  });

  it("re-evaluates lazily on dep change when no subscribers exist", () => {
    const recorder = createCassetteRecorder();
    const body = vi.fn(() => cell.read().items.length);
    const cell = createStateCell({ items: [1, 2, 3] }, recorder);
    const count = createMemoCell(body, recorder);

    expect(count.read()).toBe(3);
    expect(body).toHaveBeenCalledTimes(1);

    // No subscriber → dep change must NOT trigger body re-eval.
    const setItems = makeAction(cell, (items: number[]) => ({ items }), recorder);
    setItems([1, 2, 3, 4]);
    expect(body).toHaveBeenCalledTimes(1);

    // Next read picks up the new value (lazy re-eval).
    expect(count.read()).toBe(4);
    expect(body).toHaveBeenCalledTimes(2);
  });

  it("equality short-circuit: when output is unchanged, subscribers are NOT notified", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3], other: 0 }, recorder);
    const count = createMemoCell(() => cell.read().items.length, recorder);
    const sub = vi.fn();

    count.read(); // prime
    count.subscribe(sub);

    // Mutate `other`; items.length unchanged → memo re-evals to 3 → equal → no notify.
    const setOther = makeAction(cell, (n: number) => ({ other: n }), recorder);
    setOther(99);

    expect(sub).not.toHaveBeenCalled();
  });

  it("notifies subscribers when output changes", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3] }, recorder);
    const count = createMemoCell(() => cell.read().items.length, recorder);
    const sub = vi.fn();

    count.read();
    count.subscribe(sub);

    const setItems = makeAction(cell, (items: number[]) => ({ items }), recorder);
    setItems([1, 2]);

    expect(sub).toHaveBeenCalledTimes(1);
    expect(count.read()).toBe(2);
  });

  it("transitive memo: change to base state propagates through and respects equality short-circuit", () => {
    const recorder = createCassetteRecorder();
    const cart = createStateCell({ items: [{ price: 10 }, { price: 20 }] as { price: number }[] }, recorder);
    const subtotal = createMemoCell(() => cart.read().items.reduce((s, i) => s + i.price, 0), recorder);
    const formatted = createMemoCell(() => `$${subtotal.read()}`, recorder);

    const sub = vi.fn();
    formatted.read();
    formatted.subscribe(sub);

    // Replace with new array of items that has the same total → subtotal returns 30 still.
    const setItems = makeAction(cart, (items: { price: number }[]) => ({ items }), recorder);
    setItems([{ price: 15 }, { price: 15 }]);

    // subtotal output unchanged (30 === 30) → formatted is not notified.
    expect(sub).not.toHaveBeenCalled();

    // Now actually change the total.
    setItems([{ price: 5 }, { price: 5 }]);
    expect(sub).toHaveBeenCalledTimes(1);
    expect(formatted.read()).toBe("$10");
  });
});
