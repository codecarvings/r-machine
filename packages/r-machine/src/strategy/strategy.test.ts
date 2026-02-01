import { describe, expect, test, vi } from "vitest";
import type { AnyResourceAtlas, RMachine } from "#r-machine";
import { Strategy } from "./strategy.js";

// Track validateConfig calls externally since property initialization happens after super()
let validateConfigCallCount = 0;

// Concrete implementation for testing the abstract Strategy class
class TestStrategy<RA extends AnyResourceAtlas, C> extends Strategy<RA, C> {
  protected override validateConfig(): void {
    validateConfigCallCount++;
  }
}

// Concrete implementation that throws in validateConfig
class ThrowingStrategy<RA extends AnyResourceAtlas, C> extends Strategy<RA, C> {
  protected override validateConfig(): void {
    throw new Error("Validation failed");
  }
}

// Concrete implementation that uses default validateConfig
class DefaultValidationStrategy<RA extends AnyResourceAtlas, C> extends Strategy<RA, C> {}

// Mock RMachine for testing
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
  test("should store rMachine as readonly property", () => {
    const mockRMachine = createMockRMachine();
    const config = { option: "value" };
    const strategy = new TestStrategy(mockRMachine, config);

    expect(strategy.rMachine).toBe(mockRMachine);
  });

  test("should store config as readonly property", () => {
    const mockRMachine = createMockRMachine();
    const config = { option: "value" };
    const strategy = new TestStrategy(mockRMachine, config);

    expect(strategy.config).toBe(config);
  });

  test("should call validateConfig during construction", () => {
    const mockRMachine = createMockRMachine();
    const config = { option: "value" };
    validateConfigCallCount = 0;
    new TestStrategy(mockRMachine, config);

    expect(validateConfigCallCount).toBe(1);
  });

  test("should propagate error if validateConfig throws", () => {
    const mockRMachine = createMockRMachine();
    const config = { option: "value" };

    expect(() => new ThrowingStrategy(mockRMachine, config)).toThrow("Validation failed");
  });

  test("should work with default validateConfig implementation", () => {
    const mockRMachine = createMockRMachine();
    const config = { option: "value" };

    expect(() => new DefaultValidationStrategy(mockRMachine, config)).not.toThrow();
  });

  test("should work with different config types", () => {
    const mockRMachine = createMockRMachine();

    const stringConfig = "simple-config";
    const strategy1 = new TestStrategy(mockRMachine, stringConfig);
    expect(strategy1.config).toBe(stringConfig);

    const numberConfig = 42;
    const strategy2 = new TestStrategy(mockRMachine, numberConfig);
    expect(strategy2.config).toBe(numberConfig);

    const objectConfig = { nested: { value: true } };
    const strategy3 = new TestStrategy(mockRMachine, objectConfig);
    expect(strategy3.config).toBe(objectConfig);
  });

  test("should work with null config", () => {
    const mockRMachine = createMockRMachine();
    const strategy = new TestStrategy(mockRMachine, null);

    expect(strategy.config).toBeNull();
  });

  test("should work with undefined config", () => {
    const mockRMachine = createMockRMachine();
    const strategy = new TestStrategy(mockRMachine, undefined);

    expect(strategy.config).toBeUndefined();
  });
});
