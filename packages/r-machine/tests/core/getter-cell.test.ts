import { describe, expect, it, vi } from "vitest";
import { makeAction } from "../../src/core/action-runtime.js";
import { createCassetteRecorder } from "../../src/core/cassette-recorder.js";
import { createGetterCell } from "../../src/core/getter-cell.js";
import { createStateCell } from "../../src/core/state-cell.js";

describe("createGetterCell", () => {
  it("cache miss: the memo's private cassette captures transitive deps; outer captures only the memo", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3] }, recorder);
    const count = createGetterCell(() => cell.read().items.length, recorder);

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
    const count = createGetterCell(() => cell.read().items.length, recorder);

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
    const count = createGetterCell(body, recorder);

    expect(count.read()).toBe(3);
    expect(body).toHaveBeenCalledTimes(1);

    // No subscriber → dep change must NOT trigger body re-eval.
    const setItems = makeAction(cell, (items: number[]) => ({ items }), recorder, "setItems");
    setItems([1, 2, 3, 4]);
    expect(body).toHaveBeenCalledTimes(1);

    // Next read picks up the new value (lazy re-eval).
    expect(count.read()).toBe(4);
    expect(body).toHaveBeenCalledTimes(2);
  });

  it("equality short-circuit: when output is unchanged, subscribers are NOT notified", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3], other: 0 }, recorder);
    const count = createGetterCell(() => cell.read().items.length, recorder);
    const sub = vi.fn();

    count.read(); // prime
    count.subscribe(sub);

    // Mutate `other`; items.length unchanged → memo re-evals to 3 → equal → no notify.
    const setOther = makeAction(cell, (n: number) => ({ other: n }), recorder, "setOther");
    setOther(99);

    expect(sub).not.toHaveBeenCalled();
  });

  it("notifies subscribers when output changes", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3] }, recorder);
    const count = createGetterCell(() => cell.read().items.length, recorder);
    const sub = vi.fn();

    count.read();
    count.subscribe(sub);

    const setItems = makeAction(cell, (items: number[]) => ({ items }), recorder, "setItems");
    setItems([1, 2]);

    expect(sub).toHaveBeenCalledTimes(1);
    expect(count.read()).toBe(2);
  });

  it("transitive memo: change to base state propagates through and respects equality short-circuit", () => {
    const recorder = createCassetteRecorder();
    const cart = createStateCell({ items: [{ price: 10 }, { price: 20 }] as { price: number }[] }, recorder);
    const subtotal = createGetterCell(() => cart.read().items.reduce((s, i) => s + i.price, 0), recorder);
    const formatted = createGetterCell(() => `$${subtotal.read()}`, recorder);

    const sub = vi.fn();
    formatted.read();
    formatted.subscribe(sub);

    // Replace with new array of items that has the same total → subtotal returns 30 still.
    const setItems = makeAction(cart, (items: { price: number }[]) => ({ items }), recorder, "setItems");
    setItems([{ price: 15 }, { price: 15 }]);

    // subtotal output unchanged (30 === 30) → formatted is not notified.
    expect(sub).not.toHaveBeenCalled();

    // Now actually change the total.
    setItems([{ price: 5 }, { price: 5 }]);
    expect(sub).toHaveBeenCalledTimes(1);
    expect(formatted.read()).toBe("$10");
  });

  it("unsubscribe detaches an external subscriber (it stops being notified)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3] }, recorder);
    const count = createGetterCell(() => cell.read().items.length, recorder);
    const sub = vi.fn();

    count.read();
    const unsub = count.subscribe(sub);
    unsub();

    const setItems = makeAction(cell, (items: number[]) => ({ items }), recorder, "setItems");
    setItems([1, 2]);

    expect(sub).not.toHaveBeenCalled();
  });

  it("notifies an external subscriber inline when the dep changes outside a transaction", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ items: [1, 2, 3] }, recorder);
    const count = createGetterCell(() => cell.read().items.length, recorder);
    const sub = vi.fn();

    count.read();
    count.subscribe(sub);

    // A direct publish (not via makeAction) runs outside any transaction, so the
    // external flush happens inline rather than through the deferred dirty queue.
    cell.publish({ items: [1, 2] });

    expect(sub).toHaveBeenCalledTimes(1);
    expect(count.read()).toBe(2);
  });

  it("swallows a re-entrant invalidation when a body mutates its own dependency", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    let reentered = false;
    const g = createGetterCell(() => {
      const v = cell.read();
      if (v === 5) {
        // Mutating a dependency from within the body fires that dep's internal
        // subscribers while this cell is mid-recompute. The `recomputing` guard
        // must swallow the re-entrant invalidate instead of recursing forever.
        reentered = true;
        cell.publish(99);
      }
      return v;
    }, recorder);
    const sub = vi.fn();

    g.read(); // prime → subscribes g to cell
    g.subscribe(sub); // external sub so the next invalidate recomputes eagerly

    cell.publish(5); // → g.invalidate → recompute → body publishes(99) → re-entrant invalidate

    expect(reentered).toBe(true);
    // The outer invalidate notified exactly once; the re-entrant one was swallowed.
    expect(sub).toHaveBeenCalledTimes(1);
  });
});
