import { afterEach, describe, expect, it, vi } from "vitest";
import { createEventBus, type InternalEvent } from "../../src/core/event-bus.js";

// A representative internal event used as a payload carrier for these tests.
const evt = (namespace: string): InternalEvent =>
  ({ type: "juncture:deferredKitAccessed", namespace, ready: true }) as InternalEvent;

describe("createEventBus", () => {
  afterEach(() => vi.restoreAllMocks());

  it("delivers emitted events to a subscriber", () => {
    const bus = createEventBus();
    const received: InternalEvent[] = [];
    bus.subscribe((e) => received.push(e));

    bus.emit(evt("a"));
    bus.emit(evt("b"));

    expect(received).toEqual([evt("a"), evt("b")]);
  });

  it("delivers to every subscriber", () => {
    const bus = createEventBus();
    const one = vi.fn();
    const two = vi.fn();
    bus.subscribe(one);
    bus.subscribe(two);

    bus.emit(evt("x"));

    expect(one).toHaveBeenCalledTimes(1);
    expect(two).toHaveBeenCalledTimes(1);
  });

  it("the disposer detaches its handler", () => {
    const bus = createEventBus();
    const handler = vi.fn();
    const dispose = bus.subscribe(handler);

    bus.emit(evt("before"));
    dispose();
    bus.emit(evt("after"));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("a throwing handler does not prevent other handlers from receiving the event", () => {
    const bus = createEventBus();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const survivor = vi.fn();
    bus.subscribe(() => {
      throw new Error("boom");
    });
    bus.subscribe(survivor);

    bus.emit(evt("x"));

    expect(survivor).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalled();
  });
});
