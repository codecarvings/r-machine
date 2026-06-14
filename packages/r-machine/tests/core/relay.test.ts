import { describe, expect, it, vi } from "vitest";
import { makeAction } from "../../src/core/action-runtime.js";
import { createCassetteRecorder } from "../../src/core/cassette-recorder.js";
import { createEventBus, type InternalEvent } from "../../src/core/event-bus.js";
import { createGetterCell } from "../../src/core/getter-cell.js";
import { type AnyRelay, createRelay, createRelayRuntime } from "../../src/core/relay.js";
import { createStateCell } from "../../src/core/state-cell.js";

// Local helper: createRelay is generic in T but createRelayRuntime accepts
// AnyRelay (Relay<any>) — variance-unsafe cast needed in tests.
function mk(
  config: {
    select: () => any;
    onChange: (c: any, p: any) => any;
    equals?: "identity" | "shallow" | ((c: any, p: any) => boolean);
  },
  name: string
): AnyRelay {
  return createRelay(config, name) as AnyRelay;
}

describe("createRelayRuntime", () => {
  it("does NOT call onChange on registration (only on subsequent changes)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const onChange = vi.fn();
    createRelayRuntime(mk({ select: () => cell.read(), onChange }, "r"), recorder);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fires onChange once with (next, prev) when an action mutates a single tracked dep", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const onChange = vi.fn();
    createRelayRuntime(mk({ select: () => cell.read(), onChange }, "r"), recorder);

    const inc = makeAction(cell, (n: number) => n, recorder, "inc");
    inc(5);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(5, 0);
  });

  it("fires onChange once when an action mutates TWO deps the select reads", () => {
    const recorder = createCassetteRecorder();
    const a = createStateCell(0, recorder);
    const b = createStateCell(0, recorder);
    const onChange = vi.fn();
    createRelayRuntime(mk({ select: () => a.read() + b.read(), onChange }, "r"), recorder);

    const setBoth = makeAction(
      a,
      (na: number, nb: number) => {
        b.publish(nb);
        return na;
      },
      recorder,
      "setBoth"
    );
    setBoth(1, 2);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(3, 0);
  });

  it("two relays on the same cell both fire in registration order", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const order: string[] = [];
    createRelayRuntime(mk({ select: () => cell.read(), onChange: () => order.push("r1") }, "r1"), recorder);
    createRelayRuntime(mk({ select: () => cell.read(), onChange: () => order.push("r2") }, "r2"), recorder);

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(1);

    expect(order).toEqual(["r1", "r2"]);
  });

  it("does NOT fire onChange when Object.is(prev, next)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(42, recorder);
    const onChange = vi.fn();
    createRelayRuntime(mk({ select: () => cell.read(), onChange }, "r"), recorder);

    const noop = makeAction(cell, () => 42, recorder, "noop");
    noop();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("relay reading a memo cascades correctly when memo's deps mutate", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(2, recorder);
    const memo = createGetterCell(() => cell.read() * 10, recorder);
    const onChange = vi.fn();
    createRelayRuntime(mk({ select: () => memo.read(), onChange }, "r"), recorder);

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(3);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(30, 20);
  });

  it("select throws → bus event 'relay:onChangeError'; onChange NOT called", () => {
    const events: InternalEvent[] = [];
    const bus = createEventBus();
    bus.subscribe((e) => events.push(e));
    const recorder = createCassetteRecorder({ bus });
    const cell = createStateCell(0, recorder);
    const onChange = vi.fn();
    createRelayRuntime(
      mk(
        {
          select: () => {
            throw new Error("boom");
          },
          onChange,
        },
        "rThrow"
      ),
      recorder
    );

    // Initial select throw is surfaced as a relay error event.
    expect(events.some((e) => e.type === "relay:onChangeError" && e.relayName === "rThrow")).toBe(true);

    // Mutating the cell does not invoke onChange (deps were cleared on the
    // failing initial pass — relay stalls until next successful select).
    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(7);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("onChange throws → bus event emitted; prev IS updated; next change still fires onChange", () => {
    const events: InternalEvent[] = [];
    const bus = createEventBus();
    bus.subscribe((e) => events.push(e));
    const recorder = createCassetteRecorder({ bus });
    const cell = createStateCell(0, recorder);
    let throwOnce = true;
    const onChange = vi.fn(() => {
      if (throwOnce) {
        throwOnce = false;
        throw new Error("boom");
      }
    });
    createRelayRuntime(mk({ select: () => cell.read(), onChange }, "rOC"), recorder);

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(1, 0);
    expect(events.some((e) => e.type === "relay:onChangeError" && e.relayName === "rOC")).toBe(true);

    // prev was updated to 1; next change should fire onChange normally.
    set(2);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(2, 1);
  });

  // A numeric "tick" cell drives re-runs; select returns fresh objects so the
  // relay's own comparator (not makeAction's deepPartialMerge) is exercised.
  it("equals 'shallow': select returning a new but field-equal object does NOT fire onChange", () => {
    const recorder = createCassetteRecorder();
    const tick = createStateCell(0, recorder);
    const onChange = vi.fn();
    createRelayRuntime(
      mk(
        {
          select: () => {
            tick.read();
            return { n: 1 };
          },
          onChange,
          equals: "shallow",
        },
        "r"
      ),
      recorder
    );

    const bump = makeAction(tick, (n: number) => n, recorder, "bump");
    bump(1);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("equals 'shallow': a changed field DOES fire onChange once with (next, prev)", () => {
    const recorder = createCassetteRecorder();
    const tick = createStateCell(0, recorder);
    const onChange = vi.fn();
    createRelayRuntime(mk({ select: () => ({ n: tick.read() }), onChange, equals: "shallow" }, "r"), recorder);

    const bump = makeAction(tick, (n: number) => n, recorder, "bump");
    bump(1);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ n: 1 }, { n: 0 });
  });

  it("equals custom function returning true suppresses onChange even on different values", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const onChange = vi.fn();
    createRelayRuntime(mk({ select: () => cell.read(), onChange, equals: () => true }, "r"), recorder);

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(5);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("equals 'identity' behaves like the default: a new field-equal object DOES fire onChange", () => {
    const recorder = createCassetteRecorder();
    const tick = createStateCell(0, recorder);
    const onChange = vi.fn();
    createRelayRuntime(
      mk(
        {
          select: () => {
            tick.read();
            return { n: 1 };
          },
          onChange,
          equals: "identity",
        },
        "r"
      ),
      recorder
    );

    const bump = makeAction(tick, (n: number) => n, recorder, "bump");
    bump(1);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("dispose: relay no longer fires onChange after disposal", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const onChange = vi.fn();
    const handle = createRelayRuntime(mk({ select: () => cell.read(), onChange }, "r"), recorder);

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    set(1);
    expect(onChange).toHaveBeenCalledTimes(1);

    handle.dispose();
    set(2);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
