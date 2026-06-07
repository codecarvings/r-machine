import { describe, expect, it, vi } from "vitest";
import { createCassetteRecorder } from "../../../src/core/reactivity/cassette-recorder.js";
import { createStateCell } from "../../../src/core/reactivity/state-cell.js";

describe("createStateCell", () => {
  it("read() tracks the cell into the active cassette and returns current value", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ count: 0 }, recorder);
    const cassette = recorder.createCassette();
    cassette.insert();
    const value = cell.read();
    cassette.eject();

    expect(value).toEqual({ count: 0 });
    expect(cassette.getDeps()).toContain(cell);
  });

  it("peek() returns current value without tracking", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ count: 0 }, recorder);
    const cassette = recorder.createCassette();
    cassette.insert();
    const value = cell.peek();
    cassette.eject();

    expect(value).toEqual({ count: 0 });
    expect(cassette.getDeps()).not.toContain(cell);
  });

  it("publish() updates current and notifies subscribers", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell({ count: 0 }, recorder);
    const sub = vi.fn();
    cell.subscribe(sub);

    cell.publish({ count: 1 });

    expect(cell.peek()).toEqual({ count: 1 });
    expect(sub).toHaveBeenCalledTimes(1);
  });

  it("subscribe() returns an unsubscribe that detaches the listener", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const sub = vi.fn();
    const unsub = cell.subscribe(sub);
    unsub();

    cell.publish(1);
    expect(sub).not.toHaveBeenCalled();
  });

  it("publish() notifies multiple subscribers in registration order", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const order: number[] = [];
    cell.subscribe(() => order.push(1));
    cell.subscribe(() => order.push(2));

    cell.publish(1);
    expect(order).toEqual([1, 2]);
  });

  // Dev-only guard: vitest runs with NODE_ENV !== "production", so the cell
  // deep-freezes its current value. A consumer mutating read state in place
  // (instead of dispatching an action) must fail loudly, not silently no-op.
  describe("dev deep-freeze guard", () => {
    it("freezes the initial value (in-place mutation throws)", () => {
      const recorder = createCassetteRecorder();
      const cell = createStateCell({ count: 0, nested: { x: 1 } }, recorder);

      const state = cell.read();
      expect(Object.isFrozen(state)).toBe(true);
      expect(() => {
        (state as { count: number }).count = 1;
      }).toThrow(TypeError);
      expect(() => {
        (state.nested as { x: number }).x = 9;
      }).toThrow(TypeError);
    });

    it("freezes the published value too", () => {
      const recorder = createCassetteRecorder();
      const cell = createStateCell({ count: 0 }, recorder);

      cell.publish({ count: 5 });
      const next = cell.peek();
      expect(next).toEqual({ count: 5 });
      expect(() => {
        (next as { count: number }).count = 6;
      }).toThrow(TypeError);
    });
  });
});
