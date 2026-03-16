import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnyLocale, AnyResourceAtlas, RMachineConfig } from "#r-machine";
import { RMachine } from "../../src/lib/r-machine.js";
import { Strategy } from "../../src/strategy/strategy.js";

class SpyStrategy<RA extends AnyResourceAtlas, L extends AnyLocale, C> extends Strategy<RA, L, C> {
  static validateConfigFn = vi.fn();
  protected override validateConfig(): void {
    SpyStrategy.validateConfigFn();
  }
}

class ThrowingStrategy<RA extends AnyResourceAtlas, L extends AnyLocale, C> extends Strategy<RA, L, C> {
  protected override validateConfig(): void {
    throw new Error("Validation failed");
  }
}

class DefaultStrategy<RA extends AnyResourceAtlas, L extends AnyLocale, C> extends Strategy<RA, L, C> {}

const testConfig: RMachineConfig<string> = {
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: async () => ({ default: {} }),
};

function createTestRMachine() {
  return RMachine.for<AnyResourceAtlas>().create(testConfig);
}

describe("Strategy", () => {
  beforeEach(() => {
    SpyStrategy.validateConfigFn.mockClear();
  });

  describe("construction", () => {
    it("should call validateConfig during construction", () => {
      new SpyStrategy(createTestRMachine(), { option: "value" });
      expect(SpyStrategy.validateConfigFn).toHaveBeenCalledOnce();
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
