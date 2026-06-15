import {
  type AnyNamespace,
  type AnyResLayout,
  type AnyResModule,
  BlueprintManager,
  BUS_ACCESSOR,
  createEventBus,
  type InternalEventBus,
  ResLayoutResolver,
} from "r-machine/core";
import { describe, expect, it } from "vitest";
import { createEventCollector } from "../../src/lib/event-collector.js";

// A bridge object that satisfies BOTH BusHost (`bus`) and BusBridge
// (`[BUS_ACCESSOR]()`). Real RMachine is lazy: the bus is created on first
// BUS_ACCESSOR call. Tests eagerly create one so we can emit manually too.
function makeBridge(): {
  bus: InternalEventBus;
  [BUS_ACCESSOR]: () => InternalEventBus;
} {
  const bus = createEventBus();
  return { bus, [BUS_ACCESSOR]: () => bus };
}

describe("createEventCollector", () => {
  describe("mechanics", () => {
    it("captures events emitted on the bridge in emit order", () => {
      const bridge = makeBridge();
      const collector = createEventCollector(bridge);

      bridge.bus.emit({
        type: "blueprint:cacheHit",
        namespace: "g/x" as AnyNamespace,
        locale: undefined,
        layoutEntryType: "gear:inner",
      });
      bridge.bus.emit({
        type: "blueprint:moduleLoaded",
        namespace: "g/x" as AnyNamespace,
        locale: undefined,
      });

      expect(collector.events.map((e) => e.type)).toEqual(["blueprint:cacheHit", "blueprint:moduleLoaded"]);

      collector.dispose();
    });

    it("clear() empties the buffer but keeps the subscription active", () => {
      const bridge = makeBridge();
      const collector = createEventCollector(bridge);

      bridge.bus.emit({
        type: "blueprint:moduleLoaded",
        namespace: "g/x" as AnyNamespace,
        locale: undefined,
      });
      expect(collector.events).toHaveLength(1);

      collector.clear();
      expect(collector.events).toHaveLength(0);

      bridge.bus.emit({
        type: "blueprint:moduleLoaded",
        namespace: "g/y" as AnyNamespace,
        locale: undefined,
      });
      expect(collector.events).toHaveLength(1);
      expect(collector.events[0]).toMatchObject({ namespace: "g/y" });

      collector.dispose();
    });

    it("dispose() stops further collection", () => {
      const bridge = makeBridge();
      const collector = createEventCollector(bridge);
      collector.dispose();

      bridge.bus.emit({
        type: "blueprint:moduleLoaded",
        namespace: "g/x" as AnyNamespace,
        locale: undefined,
      });
      expect(collector.events).toHaveLength(0);
    });

    it("dispose() is idempotent", () => {
      const bridge = makeBridge();
      const collector = createEventCollector(bridge);
      collector.dispose();
      expect(() => collector.dispose()).not.toThrow();
    });
  });

  describe("end-to-end with a real BlueprintManager", () => {
    const TEST_LAYOUT: AnyResLayout = {
      "g/": "gear:inner",
    };

    function makeBpm(bridge: ReturnType<typeof makeBridge>): BlueprintManager {
      const resolver = new ResLayoutResolver(TEST_LAYOUT);
      const loader = async (): Promise<AnyResModule> => ({ r: {} as never });
      return new BlueprintManager(resolver, loader, { gear: [], shell: [] }, [], bridge);
    }

    it("collects the full resolve sequence on a first-time blueprint", async () => {
      const bridge = makeBridge();
      const collector = createEventCollector(bridge);
      const bm = makeBpm(bridge);

      await bm.getBlueprint("g/foo" as AnyNamespace, undefined, "gear:inner", "\x1fg/foo");

      const types = collector.events.map((e) => e.type);
      expect(types).toEqual(["blueprint:resolveStart", "blueprint:moduleLoaded", "blueprint:resolved"]);
      expect(collector.events[0]).toMatchObject({
        namespace: "g/foo",
        locale: undefined,
        layoutEntryType: "gear:inner",
      });
      expect(collector.events[2]).toMatchObject({ namespace: "g/foo", depList: [] });

      collector.dispose();
    });

    it("emits a single cacheHit event on a repeat resolve", async () => {
      const bridge = makeBridge();
      const bm = makeBpm(bridge);
      // Warm the cache before subscribing — we want to assert only on the
      // second call's events.
      await bm.getBlueprint("g/foo" as AnyNamespace, undefined, "gear:inner", "\x1fg/foo");

      const collector = createEventCollector(bridge);
      await bm.getBlueprint("g/foo" as AnyNamespace, undefined, "gear:inner", "\x1fg/foo");

      expect(collector.events.map((e) => e.type)).toEqual(["blueprint:cacheHit"]);

      collector.dispose();
    });

    it("emits evicted with the right keyCount after evictBlueprint", async () => {
      const bridge = makeBridge();
      const bm = makeBpm(bridge);
      await bm.getBlueprint("g/foo" as AnyNamespace, undefined, "gear:inner", "\x1fg/foo");

      const collector = createEventCollector(bridge);
      bm.evictBlueprint("g/foo" as AnyNamespace);

      expect(collector.events).toHaveLength(1);
      expect(collector.events[0]).toMatchObject({
        type: "blueprint:evicted",
        namespace: "g/foo",
        keyCount: 1,
      });

      collector.dispose();
    });
  });
});
