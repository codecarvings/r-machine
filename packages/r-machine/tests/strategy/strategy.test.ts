import { describe, expect, it, vi } from "vitest";
import { CONFIG_ACCESSOR, RMachine, type RMachineConfig } from "#r-machine";
import { type AnyResAtlas, BUS_ACCESSOR } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import { Strategy } from "../../src/strategy/strategy.js";

interface TestAtlas extends AnyResAtlas {
  readonly gear: {};
  readonly shell: {};
  readonly res: {};
}

interface TestResEquipment {
  readonly bridgeGears: readonly [];
  readonly gearKit: {};
  readonly shellKit: {};
  readonly directKit: {};
}

// Strategy has a protected constructor and protected rMachine/config; each test
// subclass declares its own public constructor so the test harness can
// instantiate them directly, and widens rMachine/config to public so tests can
// assert on stored references.
function createSpyStrategyClass<RA extends AnyResAtlas, L extends AnyLocale, C>() {
  const validateConfigSpy = vi.fn();
  class SpyStrategy extends Strategy<RA, L, TestResEquipment, {}, C> {
    // biome-ignore lint/complexity/noUselessConstructor: widens protected base ctor to public for tests
    constructor(rMachine: RMachine<RA, L, TestResEquipment, {}>, config: C) {
      super(rMachine, config);
    }
    override readonly rMachine!: RMachine<RA, L, TestResEquipment, {}>;
    override readonly config!: C;
    protected override validateConfig(): void {
      validateConfigSpy();
    }
  }
  return { SpyStrategy, validateConfigSpy };
}

class ThrowingStrategy<RA extends AnyResAtlas, L extends AnyLocale, C> extends Strategy<
  RA,
  L,
  TestResEquipment,
  {},
  C
> {
  // biome-ignore lint/complexity/noUselessConstructor: widens protected base ctor to public for tests
  constructor(rMachine: RMachine<RA, L, TestResEquipment, {}>, config: C) {
    super(rMachine, config);
  }
  override readonly rMachine!: RMachine<RA, L, TestResEquipment, {}>;
  override readonly config!: C;
  protected override validateConfig(): void {
    throw new Error("Validation failed");
  }
}

class DefaultStrategy<RA extends AnyResAtlas, L extends AnyLocale, C> extends Strategy<RA, L, TestResEquipment, {}, C> {
  // biome-ignore lint/complexity/noUselessConstructor: widens protected base ctor to public for tests
  constructor(rMachine: RMachine<RA, L, TestResEquipment, {}>, config: C) {
    super(rMachine, config);
  }
  override readonly rMachine!: RMachine<RA, L, TestResEquipment, {}>;
  override readonly config!: C;
}

// RMachine has a protected constructor; expose it via a test-only subclass so
// we can build instances directly without going through RMachine.create().
class TestRMachine extends RMachine<TestAtlas, string, TestResEquipment, {}> {
  // biome-ignore lint/complexity/noUselessConstructor: widens protected base ctor to public for tests
  constructor(config: RMachineConfig<TestAtlas, string, TestResEquipment, {}>) {
    super(config);
  }
}

const testConfig: RMachineConfig<TestAtlas, string, TestResEquipment, {}> = {
  // Phantom: the config's resourceAtlas is typed as the instance but at
  // runtime holds whatever the caller passes (the class, or — in this test —
  // a plain empty object). Cast to match the generic.
  resourceAtlas: {} as unknown as TestAtlas,
  instanceName: "test",
  locales: ["en", "it"],
  defaultLocale: "en",
  load: async () => ({ r: {} }),
  layout: {},
  priority: [],
  equipment: { bridgeGears: [], gearKit: {}, shellKit: {}, directKit: {} },
  experimental: {},
};

function createTestRMachine() {
  return new TestRMachine(testConfig);
}

describe("Strategy", () => {
  describe("construction", () => {
    it("should call validateConfig during construction", () => {
      const { SpyStrategy, validateConfigSpy } = createSpyStrategyClass<TestAtlas, string, { option: string }>();
      new SpyStrategy(createTestRMachine(), { option: "value" });
      expect(validateConfigSpy).toHaveBeenCalledOnce();
    });

    it("should propagate error if validateConfig throws", () => {
      expect(() => new ThrowingStrategy(createTestRMachine(), {})).toThrow("Validation failed");
    });

    it("should not throw with default validateConfig", () => {
      expect(() => new DefaultStrategy(createTestRMachine(), {})).not.toThrow();
    });
  });

  describe("instance properties", () => {
    it("should store the rMachine reference", () => {
      const rMachine = createTestRMachine();
      const strategy = new DefaultStrategy(rMachine, { key: "value" });
      expect(strategy.rMachine).toBe(rMachine);
    });

    it("should store the config value", () => {
      const config = { key: "value" };
      const strategy = new DefaultStrategy(createTestRMachine(), config);
      expect(strategy.config).toBe(config);
    });

    it("should accept undefined as config", () => {
      const strategy = new DefaultStrategy(createTestRMachine(), undefined);
      expect(strategy.config).toBeUndefined();
    });

    it("multiple strategies sharing the same RMachine do not interfere", () => {
      const rMachine = createTestRMachine();
      const s1 = new DefaultStrategy(rMachine, { a: 1 });
      const s2 = new DefaultStrategy(rMachine, { b: 2 });
      expect(s1.rMachine).toBe(s2.rMachine);
      expect(s1.config).not.toBe(s2.config);
    });
  });

  describe("getHelpers", () => {
    it("surfaces the RMachine's localeHelper", () => {
      const rMachine = createTestRMachine();
      const strategy = new DefaultStrategy(rMachine, {});
      expect(strategy.getHelpers().localeHelper).toBe(rMachine.localeHelper);
    });

    it("memoizes the helpers object so repeated calls return the same reference", () => {
      const strategy = new DefaultStrategy(createTestRMachine(), {});
      const first = strategy.getHelpers();
      expect(strategy.getHelpers()).toBe(first);
    });
  });

  describe("accessor delegation", () => {
    it("[BUS_ACCESSOR] returns the underlying RMachine's event bus", () => {
      const rMachine = createTestRMachine();
      const strategy = new DefaultStrategy(rMachine, {});
      expect(strategy[BUS_ACCESSOR]()).toBe(rMachine[BUS_ACCESSOR]());
    });

    it("[CONFIG_ACCESSOR] returns the underlying RMachine's config", () => {
      const rMachine = createTestRMachine();
      const strategy = new DefaultStrategy(rMachine, {});
      expect(strategy[CONFIG_ACCESSOR]()).toBe(rMachine[CONFIG_ACCESSOR]());
    });
  });
});
