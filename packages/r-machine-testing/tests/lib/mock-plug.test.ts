import type { RMachineUsageError } from "r-machine/errors";
import { afterEach, describe, expect, it } from "vitest";
import { ERR_PLUG_ALREADY_MOCKED } from "../../src/errors/index.js";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { r as listForm } from "../fixtures/mock-plug/list-form.js";
import { r as counter } from "../fixtures/mock-plug/outer-counter.js";

// Mocks live on the (singleton) plug; restore after every test so a leftover
// mock can't trip `ERR_PLUG_ALREADY_MOCKED` in the next one.
const resets: Array<() => void> = [];
afterEach(() => {
  for (const reset of resets.splice(0)) {
    reset();
  }
});

function track(reset: () => void): () => void {
  resets.push(reset);
  return reset;
}

describe("mockPlug", () => {
  describe("resource-level (§14.2): state + ports + members", () => {
    it("seeds state (deep-partial), overrides ports, and runs production members", async () => {
      const saved: number[] = [];
      track(
        mockPlug(counter.plug).with({
          $: {
            state: { count: 10 }, // deep-partial: `label` must survive
            ports: { persist: async (n) => void saved.push(n) },
          },
        })
      );

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
      const reset = mockPlug(listForm.plug).with({
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
      const reset = mockPlug(counter.plug).with({ $: { state: { count: 1 } } });

      try {
        mockPlug(counter.plug).with({ $: { state: { count: 2 } } });
        expect.unreachable("second mock on the same plug should throw");
      } catch (err) {
        expect((err as RMachineUsageError).code).toBe(ERR_PLUG_ALREADY_MOCKED);
      }

      reset(); // restore, then a fresh mock must take hold
      track(mockPlug(counter.plug).with({ $: { state: { count: 3 } } }));

      const inst = await counter.create();
      expect(inst.count()).toBe(3);
    });
  });

  describe("isolation: no leak after reset", () => {
    it("leaves a later unmocked resolve with fresh state and the production port", async () => {
      const reset = mockPlug(counter.plug).with({
        $: { state: { count: 99 }, ports: { persist: async () => {} } },
      });
      await counter.create();
      reset();

      const inst = await counter.create();
      // Fresh per-create cell → production default, not the mocked 99.
      expect(inst.count()).toBe(0);
      expect(inst.label()).toBe("init");
      // `head.ports` was never mutated → production port throws again.
      await expect(inst.save()).rejects.toThrow("persist port not mocked");
    });
  });
});
