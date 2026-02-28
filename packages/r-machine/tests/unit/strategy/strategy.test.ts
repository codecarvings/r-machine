import { describe, expect, it, vi } from "vitest";
import type { AnyResourceAtlas, RMachine } from "#r-machine";
import { Strategy } from "../../../src/strategy/strategy.js";

class SpyStrategy<RA extends AnyResourceAtlas, C> extends Strategy<RA, C> {
  static validateConfigFn = vi.fn();
  protected override validateConfig(): void {
    SpyStrategy.validateConfigFn();
  }
}

class ThrowingStrategy<RA extends AnyResourceAtlas, C> extends Strategy<RA, C> {
  protected override validateConfig(): void {
    throw new Error("Validation failed");
  }
}

function createMockRMachine(): RMachine<AnyResourceAtlas> {
  return {
    config: {
      locales: ["en", "it"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    },
    localeHelper: {},
    pickR: vi.fn(),
    pickRKit: vi.fn(),
  } as unknown as RMachine<AnyResourceAtlas>;
}

describe("Strategy", () => {
  it("should call validateConfig during construction", () => {
    SpyStrategy.validateConfigFn.mockClear();
    new SpyStrategy(createMockRMachine(), { option: "value" });
    expect(SpyStrategy.validateConfigFn).toHaveBeenCalledOnce();
  });

  it("should propagate error if validateConfig throws", () => {
    expect(() => new ThrowingStrategy(createMockRMachine(), {})).toThrow("Validation failed");
  });

  it("should not throw with default validateConfig", () => {
    class DefaultStrategy<RA extends AnyResourceAtlas, C> extends Strategy<RA, C> {}
    expect(() => new DefaultStrategy(createMockRMachine(), {})).not.toThrow();
  });
});
