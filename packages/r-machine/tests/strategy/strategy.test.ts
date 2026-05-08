import { describe, expect, it, vi } from "vitest";
import { RMachine, type RMachineConfig } from "#r-machine";
import type { AnyResAtlas } from "#r-machine/core";
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
}

// Strategy has a protected constructor; each test subclass declares its own
// public constructor so the test harness can instantiate them directly.
function createSpyStrategyClass<RA extends AnyResAtlas, L extends AnyLocale, C>() {
  const validateConfigSpy = vi.fn();
  class SpyStrategy extends Strategy<RA, L, TestResEquipment, {}, C> {
    // biome-ignore lint/complexity/noUselessConstructor: widens protected base ctor to public for tests
    constructor(rMachine: RMachine<RA, L, TestResEquipment, {}>, config: C) {
      super(rMachine, config);
    }
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
  protected override validateConfig(): void {
    throw new Error("Validation failed");
  }
}

class DefaultStrategy<RA extends AnyResAtlas, L extends AnyLocale, C> extends Strategy<RA, L, TestResEquipment, {}, C> {
  // biome-ignore lint/complexity/noUselessConstructor: widens protected base ctor to public for tests
  constructor(rMachine: RMachine<RA, L, TestResEquipment, {}>, config: C) {
    super(rMachine, config);
  }
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
  locales: ["en", "it"],
  defaultLocale: "en",
  load: async () => ({ r: {} }),
  layout: {},
  priority: [],
  equipment: { bridgeGears: [], gearKit: {}, shellKit: {} },
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
});
