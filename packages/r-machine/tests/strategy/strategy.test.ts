import { describe, expect, it, vi } from "vitest";
import type { RMachineConfig } from "#r-machine";
import type { AnyResourceAtlas } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import { RMachine } from "../../src/lib/r-machine.js";
import { Strategy } from "../../src/strategy/strategy.js";

interface TestResKit {
  gear: {};
  shell: {};
  gate: {};
}

function createSpyStrategyClass<RA extends AnyResourceAtlas, L extends AnyLocale, C>() {
  const validateConfigSpy = vi.fn();
  class SpyStrategy extends Strategy<RA, L, TestResKit, C> {
    protected override validateConfig(): void {
      validateConfigSpy();
    }
  }
  return { SpyStrategy, validateConfigSpy };
}

class ThrowingStrategy<RA extends AnyResourceAtlas, L extends AnyLocale, C> extends Strategy<RA, L, TestResKit, C> {
  protected override validateConfig(): void {
    throw new Error("Validation failed");
  }
}

class DefaultStrategy<RA extends AnyResourceAtlas, L extends AnyLocale, C> extends Strategy<RA, L, TestResKit, C> {}

const testConfig: RMachineConfig<AnyResourceAtlas, string, TestResKit> = {
  resourceAtlas: {},
  locales: ["en", "it"],
  defaultLocale: "en",
  load: async () => ({ r: {} }),
  layout: {},
  kit: { gear: {}, shell: {}, gate: {} },
};

function createTestRMachine() {
  return new RMachine<AnyResourceAtlas, string, TestResKit>(testConfig);
}

describe("Strategy", () => {
  describe("construction", () => {
    it("should call validateConfig during construction", () => {
      const { SpyStrategy, validateConfigSpy } = createSpyStrategyClass();
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
