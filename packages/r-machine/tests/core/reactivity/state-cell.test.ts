import { describe, expect, it, vi } from "vitest";
import { insertCassette } from "../../../src/core/reactivity/cassette-recorder.js";
import { createStateCell } from "../../../src/core/reactivity/state-cell.js";

describe("createStateCell", () => {
  it("read() tracks the cell into the active cassette and returns current value", () => {
    const cell = createStateCell({ count: 0 });
    const handle = insertCassette();
    const value = cell.read();
    handle.eject();

    expect(value).toEqual({ count: 0 });
    expect(handle.cassette.getDeps()).toContain(cell);
  });

  it("peek() returns current value without tracking", () => {
    const cell = createStateCell({ count: 0 });
    const handle = insertCassette();
    const value = cell.peek();
    handle.eject();

    expect(value).toEqual({ count: 0 });
    expect(handle.cassette.getDeps()).not.toContain(cell);
  });

  it("publish() updates current and notifies subscribers", () => {
    const cell = createStateCell({ count: 0 });
    const sub = vi.fn();
    cell.subscribe(sub);

    cell.publish({ count: 1 });

    expect(cell.peek()).toEqual({ count: 1 });
    expect(sub).toHaveBeenCalledTimes(1);
  });

  it("subscribe() returns an unsubscribe that detaches the listener", () => {
    const cell = createStateCell(0);
    const sub = vi.fn();
    const unsub = cell.subscribe(sub);
    unsub();

    cell.publish(1);
    expect(sub).not.toHaveBeenCalled();
  });

  it("publish() notifies multiple subscribers in registration order", () => {
    const cell = createStateCell(0);
    const order: number[] = [];
    cell.subscribe(() => order.push(1));
    cell.subscribe(() => order.push(2));

    cell.publish(1);
    expect(order).toEqual([1, 2]);
  });
});
