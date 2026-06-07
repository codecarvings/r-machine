import {
  type AnyPlugHead,
  createPlug,
  getPlugMachine,
  getPlugOverride,
  type PlugBody,
  setPlugMachine,
} from "r-machine/core";
import type { RMachineUsageError } from "r-machine/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ERR_PLUG_ALREADY_MOCKED, ERR_STATE_NOT_RESOLVED } from "../../src/errors/index.js";
import { mockPlug, resetMockPlugs } from "../../src/lib/mock-plug.js";
import { r as listForm } from "../fixtures/mock-plug/list-form.js";
import { r as counter } from "../fixtures/mock-plug/outer-counter.js";
import { r as sharedConsumer } from "../fixtures/mock-plug/shared-consumer.js";

// Both fixtures are built from the same fixture RMachine, so `getPlugMachine`
// returns the same instance for either plug.
const machine = () => getPlugMachine(counter.plug) as { testMode: { isEnabled: boolean }; disposeResources(): void };

// Mocks live on the (singleton) plug; restore after every test so a leftover
// mock can't trip `ERR_PLUG_ALREADY_MOCKED` in the next one.
const controllers: Array<{ reset: () => void }> = [];
afterEach(() => {
  for (const ctrl of controllers.splice(0)) {
    ctrl.reset();
  }
});

function track<T extends { reset: () => void }>(ctrl: T): T {
  controllers.push(ctrl);
  return ctrl;
}

describe("mockPlug", () => {
  describe("resource-level (§14.2): state + ports + members", () => {
    it("seeds state (deep-partial), overrides ports, and runs production members", async () => {
      const saved: number[] = [];
      const ctrl = track(
        mockPlug(counter.plug).with({
          $: { ports: { persist: async (n) => void saved.push(n) } },
        })
      );
      ctrl.state = { count: 10 }; // deep-partial: `label` must survive

      const inst = await counter.create();

      // Getter reads the seeded cell; untouched state key preserved.
      expect(inst.count()).toBe(10);
      expect(inst.label()).toBe("init");

      // Action runs production logic against the seeded state.
      inst.bump(5);
      expect(inst.count()).toBe(15);

      // `save` runs the production factory body, hitting the mocked port.
      await inst.save();
      expect(saved).toEqual([15]);
    });
  });

  describe("list-form positional override", () => {
    it("overrides the dep at index 0 and restores production on reset", async () => {
      const { reset } = mockPlug(listForm.plug).with({
        0: { double: (n: number) => n + 100 },
      });

      const mocked = await listForm.create();
      expect(mocked.quadruple(1)).toBe(201); // (1 + 100) + 100

      reset();

      const prod = await listForm.create();
      expect(prod.quadruple(1)).toBe(4); // production restored: (1 * 2) * 2
    });
  });

  describe("guard + reset", () => {
    it("throws ERR_PLUG_ALREADY_MOCKED on a double mock, and re-mocks after reset", async () => {
      const { reset } = mockPlug(counter.plug).with({});

      try {
        mockPlug(counter.plug).with({});
        expect.unreachable("second mock on the same plug should throw");
      } catch (err) {
        expect((err as RMachineUsageError).code).toBe(ERR_PLUG_ALREADY_MOCKED);
      }

      reset(); // restore, then a fresh mock must take hold
      const ctrl = track(mockPlug(counter.plug).with({}));
      ctrl.state = { count: 3 };

      const inst = await counter.create();
      expect(inst.count()).toBe(3);
    });
  });

  describe("isolation: no leak after reset", () => {
    it("leaves a later unmocked resolve with fresh state and the production port", async () => {
      const ctrl = mockPlug(counter.plug).with({
        $: { ports: { persist: async () => {} } },
      });
      ctrl.state = { count: 99 };
      await counter.create();
      ctrl.reset();

      const inst = await counter.create();
      // Fresh per-create cell → production default, not the mocked 99.
      expect(inst.count()).toBe(0);
      expect(inst.label()).toBe("init");
      // `head.ports` was never mutated → production port throws again.
      await expect(inst.save()).rejects.toThrow("persist port not mocked");
    });
  });

  describe("consumer-level: post-resolution override on a gate plug", () => {
    // A consumer (`realm: "gate"`) plug's own resolve is never invoked at
    // consume time, so `mockPlug` registers a `PlugOverride` (read by core's
    // getWire/getGatePlugin) instead of wrapping the resolve. Synthesise a
    // minimal gate plug bound to the fixture machine so test mode works.
    const makeGatePlug = (): PlugBody<AnyPlugHead> => {
      const plug = createPlug({ realm: "gate", mode: "map", nsDepList: [] } as unknown as AnyPlugHead);
      setPlugMachine(plug, getPlugMachine(counter.plug)!);
      return plug;
    };

    it("registers an override (locale + transform) and enters test mode; reset clears both", () => {
      const gate = makeGatePlug();
      expect(getPlugOverride(gate)).toBeUndefined();

      const { reset } = mockPlug(gate).with({ "outer/shared": { value: 42 }, $: { locale: "it" } } as never);

      const override = getPlugOverride(gate);
      expect(override?.locale).toBe("it");
      expect(typeof override?.transform).toBe("function");
      expect(machine().testMode.isEnabled).toBe(true);

      // The transform rewrites a resolved map plugin's dep surface in place.
      const resolved = { "outer/shared": { value: 1 }, $: { kit: {} } };
      const out = override?.transform?.(resolved) as { "outer/shared": { value: number } };
      expect(out["outer/shared"].value).toBe(42);
      expect((resolved as { "outer/shared": { value: number } })["outer/shared"].value).toBe(1); // original untouched

      reset();
      expect(getPlugOverride(gate)).toBeUndefined();
      expect(machine().testMode.isEnabled).toBe(false);
    });

    it("does NOT touch the consumer plug's resolve (the no-op path it replaces)", () => {
      const gate = makeGatePlug();
      track(mockPlug(gate).with({ $: { locale: "en" } } as never));
      // The override seam is used, not setPlugResolve: a registered override
      // exists and is what core consults.
      expect(getPlugOverride(gate)).toBeDefined();
    });

    it("throws ERR_PLUG_ALREADY_MOCKED on a double mock of the same gate plug", () => {
      const gate = makeGatePlug();
      const { reset } = mockPlug(gate).with({ $: { locale: "it" } } as never);
      try {
        mockPlug(gate).with({ $: { locale: "en" } } as never);
        expect.unreachable("second mock on the same gate plug should throw");
      } catch (err) {
        expect((err as RMachineUsageError).code).toBe(ERR_PLUG_ALREADY_MOCKED);
      }
      reset();
    });
  });

  describe("test mode", () => {
    it("enters on .with(...) and exits on reset", () => {
      expect(machine().testMode.isEnabled).toBe(false);
      const { reset } = mockPlug(counter.plug).with({});
      expect(machine().testMode.isEnabled).toBe(true);
      reset();
      expect(machine().testMode.isEnabled).toBe(false);
    });

    it("stays in test mode until the last reset and disposes the machine exactly once", () => {
      const disposeSpy = vi.spyOn(machine(), "disposeResources");
      const { reset: reset1 } = mockPlug(counter.plug).with({});
      const { reset: reset2 } = mockPlug(listForm.plug).with({ 0: { double: (n: number) => n } });
      expect(machine().testMode.isEnabled).toBe(true);

      reset1();
      expect(machine().testMode.isEnabled).toBe(true); // listForm mock still active
      expect(disposeSpy).not.toHaveBeenCalled();

      reset2();
      expect(machine().testMode.isEnabled).toBe(false);
      expect(disposeSpy).toHaveBeenCalledTimes(1);
      disposeSpy.mockRestore();
    });

    it("reset is idempotent (single decrement, single dispose)", () => {
      const disposeSpy = vi.spyOn(machine(), "disposeResources");
      const { reset } = mockPlug(counter.plug).with({});
      reset();
      reset(); // no-op
      expect(machine().testMode.isEnabled).toBe(false);
      expect(disposeSpy).toHaveBeenCalledTimes(1);
      disposeSpy.mockRestore();
    });

    it("default() enters/exits without seeding", () => {
      const { reset } = mockPlug(counter.plug).default();
      expect(machine().testMode.isEnabled).toBe(true);
      reset();
      expect(machine().testMode.isEnabled).toBe(false);
    });

    it("a rejected double-mock does NOT enter test mode", () => {
      const { reset } = mockPlug(counter.plug).with({});
      expect(machine().testMode.isEnabled).toBe(true); // refcount 1

      try {
        mockPlug(counter.plug).with({});
        expect.unreachable("second mock on the same plug should throw");
      } catch (err) {
        expect((err as RMachineUsageError).code).toBe(ERR_PLUG_ALREADY_MOCKED);
      }

      // The rejected mock must not have bumped the refcount: a single reset
      // brings it back to 0.
      reset();
      expect(machine().testMode.isEnabled).toBe(false);
    });

    it("resetMockPlugs drains active mock plugs and restores resolves", async () => {
      // Two "forgotten" entries (never reset by the test).
      mockPlug(counter.plug).with({});
      mockPlug(listForm.plug).default();
      expect(machine().testMode.isEnabled).toBe(true);

      resetMockPlugs();
      expect(machine().testMode.isEnabled).toBe(false);

      // The counter plug's resolve was restored → production default.
      const inst = await counter.create();
      expect(inst.count()).toBe(0);
    });
  });

  describe("controller: state handles (read/write the live cell)", () => {
    it("own state (`ctrl.state`): seed before resolve, then read/write live", async () => {
      const ctrl = track(mockPlug(counter.plug).default());

      // Read before the plug is resolved → loud error (no cell, no seed).
      try {
        void ctrl.state;
        expect.unreachable("reading state before resolve should throw");
      } catch (err) {
        expect((err as RMachineUsageError).code).toBe(ERR_STATE_NOT_RESOLVED);
      }

      // Seed (write before the cell exists): queued, applied at resolve.
      ctrl.state = { count: 10, label: "x" };

      const inst = await counter.create();
      // Real getters read the seeded cell; controller reads the same live cell.
      expect(inst.count()).toBe(10);
      expect(ctrl.state).toEqual({ count: 10, label: "x" });

      // Live write through the controller → the real getter reflects it.
      ctrl.state = { count: 20, label: "y" };
      expect(inst.count()).toBe(20);
      expect(ctrl.state).toEqual({ count: 20, label: "y" });

      // A real action publishes to the same cell → the controller observes it.
      inst.bump(5);
      expect(ctrl.state).toEqual({ count: 25, label: "y" });
    });

    it("dep state (`ctrl.deps[0].state`): drives a stateful OuterGear dependency's cell", async () => {
      // `shared-consumer` depends on the stateful `outer/shared` (state `{ n }`).
      const ctrl = track(mockPlug(sharedConsumer.plug).default());

      ctrl.deps[0].state = { n: 5 }; // seed the dependency's state

      const inst = await sharedConsumer.create();
      // The consumer's real getter reads the dep's seeded state.
      expect(inst.sharedValue()).toBe(5);
      expect(ctrl.deps[0].state).toEqual({ n: 5 });

      // Live write through the controller → the consumer's getter reflects it.
      ctrl.deps[0].state = { n: 9 };
      expect(inst.sharedValue()).toBe(9);

      // Driving the dep's real action also updates what the controller reads.
      inst.bumpShared();
      expect(ctrl.deps[0].state).toEqual({ n: 10 });
    });

    it("reset() clears the controller (state throws again after reset)", async () => {
      const ctrl = mockPlug(counter.plug).default();
      ctrl.state = { count: 3, label: "z" };
      await counter.create();
      expect(ctrl.state).toEqual({ count: 3, label: "z" });

      ctrl.reset();

      try {
        void ctrl.state;
        expect.unreachable("reading state after reset should throw");
      } catch (err) {
        expect((err as RMachineUsageError).code).toBe(ERR_STATE_NOT_RESOLVED);
      }
    });
  });
});
