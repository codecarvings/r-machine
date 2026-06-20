import {
  type AnyMapPlugHead,
  createPlug,
  getPlugMachine,
  getPlugOverride,
  type PlugBody,
  setPlugMachine,
} from "r-machine/core";
import type { RMachineUsageError } from "r-machine/errors";
import { describe, expect, it, vi } from "vitest";
import { ERR_PLUG_ALREADY_MOCKED, ERR_STATE_NOT_RESOLVED } from "../../src/errors/index.js";
import { mockPlug, resetMockPlugs } from "../../src/lib/mock-plug.js";
import { r as kitConsumer } from "../fixtures/mock-plug/kit-consumer.js";
import { r as listForm } from "../fixtures/mock-plug/list-form.js";
import { r as mappedConsumer } from "../fixtures/mock-plug/mapped-consumer.js";
import { r as counter } from "../fixtures/mock-plug/outer-counter.js";
import { r as sharedConsumer } from "../fixtures/mock-plug/shared-consumer.js";

// Both fixtures are built from the same fixture RMachine, so `getPlugMachine`
// returns the same instance for either plug.
const machine = () => getPlugMachine(counter.plug) as { testMode: { isEnabled: boolean }; disposeResources(): void };

// Mocks live on the (singleton) plug; cleanup-only mocks are bound with `using`
// so their `[Symbol.dispose]` (= reset) restores the plug at block-scope exit —
// even on a failing assertion — so a leftover mock can't trip
// `ERR_PLUG_ALREADY_MOCKED` in the next test. Lifecycle tests below that ASSERT
// on reset still call `reset()` explicitly.
describe("mockPlug", () => {
  describe("resource-level (§14.2): state + ports + members", () => {
    it("seeds state (deep-partial), overrides ports, and runs production members", async () => {
      const saved: number[] = [];
      using ctrl = mockPlug(counter.plug).with({
        $: { ports: { persist: async (n) => void saved.push(n) } },
      });
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
      using ctrl = mockPlug(counter.plug).with({});
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
    const makeGatePlug = (): PlugBody<AnyMapPlugHead> => {
      // The synthetic gate plug is map-mode, so type it as a map head — mockPlug's
      // overloads require a map/list head, not the wide AnyPlugHead.
      const plug = createPlug({ realm: "gate", mode: "map", nsDepList: [] } as unknown as AnyMapPlugHead);
      setPlugMachine(plug, getPlugMachine(counter.plug)!);
      return plug;
    };

    it("registers an override (ambientLocale + transform) and enters test mode; reset clears both", () => {
      const gate = makeGatePlug();
      expect(getPlugOverride(gate)).toBeUndefined();

      const { reset } = mockPlug(gate).with({ "outer/shared": { value: 42 }, $: { ambientLocale: "it" } } as never);

      const override = getPlugOverride(gate);
      expect(override?.ambientLocale).toBe("it");
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
      using _ctrl = mockPlug(gate).with({ $: { ambientLocale: "en" } } as never);
      // The override seam is used, not setPlugResolve: a registered override
      // exists and is what core consults.
      expect(getPlugOverride(gate)).toBeDefined();
    });

    it("throws ERR_PLUG_ALREADY_MOCKED on a double mock of the same gate plug", () => {
      const gate = makeGatePlug();
      const { reset } = mockPlug(gate).with({ $: { ambientLocale: "it" } } as never);
      try {
        mockPlug(gate).with({ $: { ambientLocale: "en" } } as never);
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
    // `ctrl.deps` is a runtime Proxy that mints a live state handle per access.
    // A consumer's atlas is shape-only — it cannot carry a *dependency's* STATE
    // type (see project_resatlas_member_perf_trap: dep state-views are derived
    // per-plug in the testing layer, never on ResAtlas) — so the controller type
    // omits `deps` for stateful dependencies. Tests reach the live handles via
    // this typed view; own-state (`ctrl.state`) stays fully typed off the head.
    type DepHandles<S> = Record<PropertyKey, { state: S }>;
    const depsView = <S>(ctrl: object): DepHandles<S> => (ctrl as unknown as { deps: DepHandles<S> }).deps;

    it("own state (`ctrl.state`): seed before resolve, then read/write live", async () => {
      using ctrl = mockPlug(counter.plug).default();

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
      using ctrl = mockPlug(sharedConsumer.plug).default();
      const deps = depsView<{ n: number }>(ctrl);

      deps[0].state = { n: 5 }; // seed the dependency's state

      const inst = await sharedConsumer.create();
      // The consumer's real getter reads the dep's seeded state.
      expect(inst.sharedValue()).toBe(5);
      expect(deps[0].state).toEqual({ n: 5 });

      // Live write through the controller → the consumer's getter reflects it.
      deps[0].state = { n: 9 };
      expect(inst.sharedValue()).toBe(9);

      // Driving the dep's real action also updates what the controller reads.
      inst.bumpShared();
      expect(deps[0].state).toEqual({ n: 10 });
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

    it("named dep state (`ctrl.deps.shared.state`): drives a map-form stateful dependency", async () => {
      // `mapped-consumer` depends on `outer/shared` under the NAMED key `shared`,
      // so the controller binds it via the object branch (head.nsDeps), not the
      // positional list branch.
      using ctrl = mockPlug(mappedConsumer.plug).default();
      const deps = depsView<{ n: number }>(ctrl);

      deps.shared.state = { n: 7 }; // seed the named dependency's state

      const inst = await mappedConsumer.create();
      expect(inst.sharedValue()).toBe(7);
      expect(deps.shared.state).toEqual({ n: 7 });

      // Live write through the named handle is reflected by the consumer's getter.
      deps.shared.state = { n: 11 };
      expect(inst.sharedValue()).toBe(11);

      // The dep's real action publishes to the same cell the controller reads.
      inst.bumpShared();
      expect(deps.shared.state).toEqual({ n: 12 });
    });

    it("binds a live cell even when nothing was seeded (read-only controller use)", async () => {
      // No `ctrl.state = ...` before resolve: the bind attaches the cell with no
      // queued seed, then reads/writes go straight to the production-default cell.
      using ctrl = mockPlug(counter.plug).default();

      const inst = await counter.create();
      // Production default, untouched — the controller still reads the live cell.
      expect(ctrl.state).toEqual({ count: 0, label: "init" });

      ctrl.state = { count: 4 };
      expect(inst.count()).toBe(4);
    });

    it("binds kit entries on resolve without exposing a handle for stateless ones", async () => {
      // `kit-consumer` carries the machine-wide `helper` kit (a stateless
      // BaseGear). Resolving it walks the kit-binding loop; the entry has no
      // state cell, so it binds to nothing and `ctrl.kit.helper.state` stays
      // unresolved (the type layer also hides it — it is out-of-band here).
      using ctrl = mockPlug(kitConsumer.plug).default();

      const inst = await kitConsumer.create();
      expect(inst.viaKit()).toBe("hi x"); // production kit runs untouched

      // Reaching for a stateless kit entry's `.state` throws — there is no cell.
      try {
        void (ctrl as unknown as { kit: Record<string, { state: unknown }> }).kit.helper.state;
        expect.unreachable("a stateless kit entry has no live state cell");
      } catch (err) {
        expect((err as RMachineUsageError).code).toBe(ERR_STATE_NOT_RESOLVED);
      }
    });
  });
});
