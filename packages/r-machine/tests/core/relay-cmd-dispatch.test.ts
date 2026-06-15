import { describe, expect, it, vi } from "vitest";
import { makeAction } from "../../src/core/action-runtime.js";
import { createCassetteRecorder, RelayLoopError } from "../../src/core/cassette-recorder.js";
import { createCmd } from "../../src/core/cmd.js";
import { createEventBus, type InternalEvent } from "../../src/core/event-bus.js";
import { type AnyRelay, createRelay, createRelayRuntime } from "../../src/core/relay.js";
import { createStateCell } from "../../src/core/state-cell.js";

// Local helper: createRelay is generic in T but createRelayRuntime accepts
// AnyRelay (Relay<any>) — variance-unsafe cast needed in tests.
function mk(config: { select: () => any; onChange: (c: any, p: any) => any }, name: string): AnyRelay {
  return createRelay(config, name) as AnyRelay;
}

describe("relay cmd dispatch (sync)", () => {
  it("returning a single Cmd from onChange dispatches the wrapped action", () => {
    const recorder = createCassetteRecorder();
    const cellA = createStateCell(0, recorder);
    const cellB = createStateCell(0, recorder);
    const setB = makeAction(cellB, (n: number) => n, recorder, "setB");

    createRelayRuntime(
      mk(
        {
          select: () => cellA.read(),
          onChange: (current) => createCmd(setB, [(current as number) * 10]),
        },
        "r"
      ),
      recorder
    );

    const setA = makeAction(cellA, (n: number) => n, recorder, "setA");
    setA(3);

    expect(cellB.peek()).toBe(30);
  });

  it("returning a Cmd[] dispatches all of them in order", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const order: number[] = [];
    const a1 = makeAction(
      cell,
      (n: number) => {
        order.push(n * 1);
        return n;
      },
      recorder,
      "a1"
    );
    const a2 = makeAction(
      cell,
      (n: number) => {
        order.push(n * 2);
        return n;
      },
      recorder,
      "a2"
    );
    const a3 = makeAction(
      cell,
      (n: number) => {
        order.push(n * 3);
        return n;
      },
      recorder,
      "a3"
    );

    const trigger = createStateCell(0, recorder);
    createRelayRuntime(
      mk(
        {
          select: () => trigger.read(),
          onChange: () => [createCmd(a1, [1]), createCmd(a2, [1]), createCmd(a3, [1])],
        },
        "r"
      ),
      recorder
    );

    const fire = makeAction(trigger, (n: number) => n, recorder, "fire");
    fire(1);

    expect(order).toEqual([1, 2, 3]);
  });

  it("an error thrown by a synchronously-dispatched cmd is caught and emitted as relay:onChangeError", () => {
    const events: InternalEvent[] = [];
    const bus = createEventBus();
    bus.subscribe((e) => events.push(e));
    const recorder = createCassetteRecorder({ bus });
    const trigger = createStateCell(0, recorder);
    const cell = createStateCell(0, recorder);
    const boom = makeAction(
      cell,
      () => {
        throw new Error("sync cmd boom");
      },
      recorder,
      "boom"
    );
    createRelayRuntime(mk({ select: () => trigger.read(), onChange: () => createCmd(boom, []) }, "r"), recorder);

    const fire = makeAction(trigger, (n: number) => n, recorder, "fire");
    // The flush swallows the cmd error so the triggering action does not throw.
    expect(() => fire(1)).not.toThrow();

    expect(events.some((e) => e.type === "relay:onChangeError" && e.relayName === "<cmd-dispatch>")).toBe(true);
  });

  it("invalid return values (string, number, object) are ignored", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const onChange = vi.fn(() => "not-a-cmd");
    createRelayRuntime(mk({ select: () => cell.read(), onChange }, "r"), recorder);

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    expect(() => set(1)).not.toThrow();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("cascade: cmd dispatched by relay R1 triggers a second relay R2 in a subsequent iteration", () => {
    const recorder = createCassetteRecorder();
    const a = createStateCell(0, recorder);
    const b = createStateCell(0, recorder);
    const setB = makeAction(b, (n: number) => n, recorder, "setB");

    const r2Spy = vi.fn();
    // R1 watches a, dispatches setB(a*10) via cmd
    createRelayRuntime(
      mk(
        {
          select: () => a.read(),
          onChange: (c) => createCmd(setB, [(c as number) * 10]),
        },
        "R1"
      ),
      recorder
    );
    // R2 watches b
    createRelayRuntime(mk({ select: () => b.read(), onChange: (c, p) => r2Spy(c, p) }, "R2"), recorder);

    const setA = makeAction(a, (n: number) => n, recorder, "setA");
    setA(4);

    // R1 fires → cmd setB(40) → cellB mutates → R2 fires next iteration.
    expect(b.peek()).toBe(40);
    expect(r2Spy).toHaveBeenCalledTimes(1);
    expect(r2Spy).toHaveBeenCalledWith(40, 0);
  });
});

describe("relay loop detection", () => {
  it("relay that mutates its own dep via cmd loops up to limit then throws RelayLoopError + emits event", () => {
    const events: InternalEvent[] = [];
    const bus = createEventBus();
    bus.subscribe((e) => events.push(e));
    const recorder = createCassetteRecorder({ bus });

    const cell = createStateCell(0, recorder);
    // Action that always bumps the cell by 1 — fed by the relay's own cmd → infinite loop.
    const bump = makeAction(cell, (n: number) => n + 1, recorder, "bump");

    createRelayRuntime(
      mk(
        {
          select: () => cell.read(),
          // Always returns a cmd → infinite loop until detection kicks in.
          onChange: () => createCmd(bump, [cell.peek()]),
        },
        "looper"
      ),
      recorder
    );

    const start = makeAction(cell, (n: number) => n, recorder, "start");
    expect(() => start(1)).toThrowError(RelayLoopError);

    // A `relay:loopDetected` event must have been emitted, attributed to "looper".
    const loopEvent = events.find((e) => e.type === "relay:loopDetected");
    expect(loopEvent).toBeDefined();
    expect(loopEvent && "relayName" in loopEvent && loopEvent.relayName).toBe("looper");
  });

  it("RelayLoopError carries relayName and runCount; runCount > limit (3)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const bump = makeAction(cell, (n: number) => n + 1, recorder, "bump");
    createRelayRuntime(
      mk(
        {
          select: () => cell.read(),
          onChange: () => createCmd(bump, [cell.peek()]),
        },
        "L"
      ),
      recorder
    );

    const start = makeAction(cell, (n: number) => n, recorder, "start");
    try {
      start(1);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(RelayLoopError);
      expect((e as RelayLoopError).relayName).toBe("L");
      expect((e as RelayLoopError).runCount).toBeGreaterThan(3);
    }
  });

  it("dirty queues are cleared after loop detection (next flush is clean)", () => {
    const recorder = createCassetteRecorder();
    const cell = createStateCell(0, recorder);
    const bump = makeAction(cell, (n: number) => n + 1, recorder, "bump");
    createRelayRuntime(
      mk({ select: () => cell.read(), onChange: () => createCmd(bump, [cell.peek()]) }, "L"),
      recorder
    );

    const start = makeAction(cell, (n: number) => n, recorder, "start");
    expect(() => start(1)).toThrow();

    // A second action on a different cell should NOT throw — queues are clean.
    const otherCell = createStateCell(0, recorder);
    const setOther = makeAction(otherCell, (n: number) => n, recorder, "setOther");
    expect(() => setOther(5)).not.toThrow();
    expect(otherCell.peek()).toBe(5);
  });
});

describe("relay async onChange (out-of-band)", () => {
  it("onChange returning a Promise does NOT block the action; cmds dispatched after await", async () => {
    const recorder = createCassetteRecorder();
    const trigger = createStateCell(0, recorder);
    const target = createStateCell(0, recorder);
    const setTarget = makeAction(target, (n: number) => n, recorder, "setTarget");

    let resolveOnce!: (v: unknown) => void;
    const onChange = vi.fn(
      () =>
        new Promise<unknown>((res) => {
          resolveOnce = res;
        })
    );
    createRelayRuntime(mk({ select: () => trigger.read(), onChange }, "r"), recorder);

    const fire = makeAction(trigger, (n: number) => n, recorder, "fire");
    fire(7);

    // Sync part finished; onChange invoked, but Promise unresolved →
    // target cell is STILL 0 (cmd not dispatched yet).
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(target.peek()).toBe(0);

    // Resolve the Promise with a Cmd; microtask drains and dispatches it.
    resolveOnce(createCmd(setTarget, [42]));
    await Promise.resolve(); // flush microtask
    await Promise.resolve(); // belt-and-suspenders for nested microtasks

    expect(target.peek()).toBe(42);
  });

  it("async Promise rejection is swallowed and emitted as relay:onChangeError", async () => {
    const events: InternalEvent[] = [];
    const bus = createEventBus();
    bus.subscribe((e) => events.push(e));
    const recorder = createCassetteRecorder({ bus });
    const cell = createStateCell(0, recorder);

    createRelayRuntime(
      mk({ select: () => cell.read(), onChange: () => Promise.reject(new Error("boom")) }, "rAsync"),
      recorder
    );

    const set = makeAction(cell, (n: number) => n, recorder, "set");
    expect(() => set(1)).not.toThrow();

    await Promise.resolve();
    await Promise.resolve();

    expect(events.some((e) => e.type === "relay:onChangeError" && e.relayName === "rAsync")).toBe(true);
  });

  it("async resolved cmds open a NEW transaction (separate flush from the triggering one)", async () => {
    const recorder = createCassetteRecorder();
    const trigger = createStateCell(0, recorder);
    const target = createStateCell(0, recorder);
    const setTarget = makeAction(target, (n: number) => n, recorder, "setTarget");

    // Spy on a separate relay watching `target`. If the async cmd dispatch
    // opens its own tx, this relay should fire ONCE after the await — a
    // separate flush cycle.
    const targetSpy = vi.fn();
    createRelayRuntime(
      mk({ select: () => target.read(), onChange: (c, p) => targetSpy(c, p) }, "targetWatcher"),
      recorder
    );

    createRelayRuntime(
      mk(
        {
          select: () => trigger.read(),
          onChange: () => Promise.resolve(createCmd(setTarget, [99])),
        },
        "asyncDispatcher"
      ),
      recorder
    );

    const fire = makeAction(trigger, (n: number) => n, recorder, "fire");
    fire(1);

    // Sync flush finished; targetWatcher has NOT fired yet (target still 0).
    expect(targetSpy).not.toHaveBeenCalled();

    await Promise.resolve();
    await Promise.resolve();

    expect(target.peek()).toBe(99);
    expect(targetSpy).toHaveBeenCalledTimes(1);
    expect(targetSpy).toHaveBeenCalledWith(99, 0);
  });

  it("an async onChange that resolves without a cmd dispatches nothing (no transaction)", async () => {
    const recorder = createCassetteRecorder();
    const trigger = createStateCell(0, recorder);
    const target = createStateCell(0, recorder);

    // A watcher on `target` proves the empty resolve opens no transaction.
    const targetSpy = vi.fn();
    createRelayRuntime(mk({ select: () => target.read(), onChange: (c, p) => targetSpy(c, p) }, "watcher"), recorder);
    // Resolves to `undefined` → normalizeCmds yields [] → nothing dispatched.
    createRelayRuntime(mk({ select: () => trigger.read(), onChange: () => Promise.resolve(undefined) }, "r"), recorder);

    const fire = makeAction(trigger, (n: number) => n, recorder, "fire");
    expect(() => fire(1)).not.toThrow();

    await Promise.resolve();
    await Promise.resolve();

    expect(targetSpy).not.toHaveBeenCalled();
    expect(target.peek()).toBe(0);
  });

  it("an error thrown while dispatching an async-resolved cmd is emitted as relay:onChangeError", async () => {
    const events: InternalEvent[] = [];
    const bus = createEventBus();
    bus.subscribe((e) => events.push(e));
    const recorder = createCassetteRecorder({ bus });
    const trigger = createStateCell(0, recorder);
    const cell = createStateCell(0, recorder);
    const boom = makeAction(
      cell,
      () => {
        throw new Error("cmd boom");
      },
      recorder,
      "boom"
    );

    createRelayRuntime(
      mk({ select: () => trigger.read(), onChange: () => Promise.resolve(createCmd(boom, [])) }, "rThrow"),
      recorder
    );

    const fire = makeAction(trigger, (n: number) => n, recorder, "fire");
    fire(1);

    await Promise.resolve();
    await Promise.resolve();

    expect(events.some((e) => e.type === "relay:onChangeError" && e.relayName === "rThrow")).toBe(true);
  });
});
