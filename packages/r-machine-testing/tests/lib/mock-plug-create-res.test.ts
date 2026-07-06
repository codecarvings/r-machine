import { describe, expect, it, vi } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { r as counter } from "../fixtures/mock-plug/outer-counter.js";
import { OuterGear } from "../fixtures/mock-plug/setup.js";

// `ctrl.createRes()` instantiates the mocked resource and returns its
// `TestSurface`: the SAME shape a dependency is mocked in (getter → property),
// so a test speaks one language on both sides. This suite pins that projection.

// A self-contained stateful gear exercising every member kind TestSurface must
// handle: getter + cell (→ property), action (callable, returns new state),
// relay + `Symbol.dispose` (retained — a consumer's `Surface` hides both).
const makeGear = (onDispose: () => void = () => {}) =>
  OuterGear.withState({ n: 0 }).define((plugin, _) => {
    const { $ } = plugin;
    return {
      n: _.getter(() => $.state.n),
      doubled: _.cell(() => $.state.n * 2),
      inc: _.action(() => ({ n: $.state.n + 1 })),
      $relay: _.relay({ select: () => $.state.n, onChange: () => {} }),
      [Symbol.dispose]: onDispose,
    };
  });

describe("ctrl.createRes — TestSurface projection", () => {
  it("reads getters and cells as PROPERTIES, not functions", async () => {
    const gear = makeGear();
    using ctrl = mockPlug(gear).default();
    const inst = await ctrl.createRes();

    // The whole point: a getter/cell is a value here, exactly like the mock
    // input side — NOT the kernel's callable `() => V`.
    expect(typeof inst.n).toBe("number");
    expect(typeof inst.doubled).toBe("number");
    expect(inst.n).toBe(0);
    expect(inst.doubled).toBe(0);
  });

  it("keeps actions callable and returns the resulting full state", async () => {
    const gear = makeGear();
    using ctrl = mockPlug(gear).default();
    const inst = await ctrl.createRes();

    expect(typeof inst.inc).toBe("function");
    // Action stays `Action<F>` → returns the new state (not void), useful to
    // assert what an action produced.
    expect(inst.inc()).toEqual({ n: 1 });
    // Property re-reads are fresh after a mutation.
    expect(inst.n).toBe(1);
    expect(inst.doubled).toBe(2);
  });

  it("retains relays and `Symbol.dispose` (a consumer Surface hides both)", async () => {
    const onDispose = vi.fn();
    const gear = makeGear(onDispose);
    using ctrl = mockPlug(gear).default();
    {
      using inst = await ctrl.createRes();
      // Relay is present (on the consumer Surface it is projected to `never`).
      expect(inst.$relay).toBeDefined();
      // Symbol.dispose is retained (Surface drops symbol keys).
      expect(typeof inst[Symbol.dispose]).toBe("function");
    } // `using` disposes here → teardown runs.
    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it("applies the mock's state seed and port override through createRes", async () => {
    const saved: number[] = [];
    using ctrl = mockPlug(counter).with({
      $: { ports: { persist: async (n) => void saved.push(n) } },
    });
    ctrl.state = { count: 10 }; // deep-partial: `label` survives

    const inst = await ctrl.createRes();
    expect(inst.count).toBe(10); // getter → property, seeded state
    expect(inst.label).toBe("init"); // untouched key preserved

    inst.bump(5); // production action against the seeded state
    expect(inst.count).toBe(15);

    await inst.save(); // hits the mocked port
    expect(saved).toEqual([15]);
  });
});

describe("ctrl.createRes — auto-dispose of created instances", () => {
  it("auto-disposes an instance the test did NOT dispose, on ctrl reset", async () => {
    const onDispose = vi.fn();
    const gear = makeGear(onDispose);
    {
      using ctrl = mockPlug(gear).default();
      const inst = await ctrl.createRes(); // note: no `using` — the test never disposes
      expect(inst.n).toBe(0);
      expect(onDispose).not.toHaveBeenCalled();
    } // ctrl resets here → controller auto-disposes what it created
    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it("does not double-dispose: `using inst` + the controller's auto-dispose still runs teardown once", async () => {
    const onDispose = vi.fn();
    const gear = makeGear(onDispose);
    {
      using ctrl = mockPlug(gear).default();
      {
        using inst = await ctrl.createRes();
        expect(inst.n).toBe(0);
      } // `using inst` disposes here
      expect(onDispose).toHaveBeenCalledTimes(1);
    } // ctrl reset also disposes — but dispose is idempotent → no second teardown
    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it("dispose is idempotent — repeated calls (test + controller) run the teardown once", async () => {
    const onDispose = vi.fn();
    const gear = makeGear(onDispose);
    {
      using ctrl = mockPlug(gear).default();
      const inst = await ctrl.createRes();
      inst[Symbol.dispose]();
      inst[Symbol.dispose]();
      inst[Symbol.dispose]();
      expect(onDispose).toHaveBeenCalledTimes(1);
    } // ctrl reset disposes again — still idempotent
    expect(onDispose).toHaveBeenCalledTimes(1);
  });
});
