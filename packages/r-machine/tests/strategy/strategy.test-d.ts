import { describe, expectTypeOf, it } from "vitest";
import type { AnyResourceAtlas, RMachine } from "#r-machine";
import { Strategy } from "../../src/strategy/strategy.js";

// Test ResourceAtlas type for testing
interface TestResourceAtlas extends AnyResourceAtlas {
  common: { greeting: string };
  errors: { notFound: string };
}

// Test config type
interface TestConfig {
  option: string;
  enabled: boolean;
}

// Concrete implementation for type testing
class TestStrategy extends Strategy<TestResourceAtlas, TestConfig> {}

describe("Strategy", () => {
  it("should be an abstract class with constructable subclasses", () => {
    // Strategy is abstract, we verify subclasses are constructable
    expectTypeOf(TestStrategy).toBeConstructibleWith({} as RMachine<TestResourceAtlas>, {
      option: "test",
      enabled: true,
    });
  });

  it("should have two generic type parameters", () => {
    expectTypeOf<Strategy<TestResourceAtlas, TestConfig>>().toBeObject();
  });

  it("rMachine property should be readonly RMachine<RA>", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("rMachine");
    expectTypeOf<TestStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResourceAtlas>>();
  });

  it("config property should be readonly C", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("config");
    expectTypeOf<TestStrategy["config"]>().toEqualTypeOf<TestConfig>();
  });

  it("constructor should accept RMachine and config parameters", () => {
    expectTypeOf(TestStrategy).constructorParameters.toEqualTypeOf<
      [rMachine: RMachine<TestResourceAtlas>, config: TestConfig]
    >();
  });

  it("validateConfig should be a protected method returning void", () => {
    // We can't directly test protected methods with expectTypeOf,
    // but we can verify the class structure allows overriding
    class ValidatingStrategy extends Strategy<TestResourceAtlas, TestConfig> {
      protected override validateConfig(): void {
        // Access base class properties in override
        const _config = this.config;
        const _rMachine = this.rMachine;
      }
    }
    expectTypeOf<ValidatingStrategy>().toExtend<Strategy<TestResourceAtlas, TestConfig>>();
  });
});

describe("Strategy with different config types", () => {
  it("should work with string config", () => {
    class StringConfigStrategy extends Strategy<AnyResourceAtlas, string> {}
    expectTypeOf<StringConfigStrategy["config"]>().toEqualTypeOf<string>();
  });

  it("should work with number config", () => {
    class NumberConfigStrategy extends Strategy<AnyResourceAtlas, number> {}
    expectTypeOf<NumberConfigStrategy["config"]>().toEqualTypeOf<number>();
  });

  it("should work with null config", () => {
    class NullConfigStrategy extends Strategy<AnyResourceAtlas, null> {}
    expectTypeOf<NullConfigStrategy["config"]>().toEqualTypeOf<null>();
  });

  it("should work with undefined config", () => {
    class UndefinedConfigStrategy extends Strategy<AnyResourceAtlas, undefined> {}
    expectTypeOf<UndefinedConfigStrategy["config"]>().toEqualTypeOf<undefined>();
  });

  it("should work with union config type", () => {
    class UnionConfigStrategy extends Strategy<AnyResourceAtlas, string | number> {}
    expectTypeOf<UnionConfigStrategy["config"]>().toEqualTypeOf<string | number>();
  });
});

describe("Strategy type constraints", () => {
  it("RA should extend AnyResourceAtlas", () => {
    // Valid: TestResourceAtlas extends AnyResourceAtlas
    expectTypeOf<Strategy<TestResourceAtlas, TestConfig>>().toBeObject();
  });

  it("Strategy instances should extend Strategy base type", () => {
    expectTypeOf<TestStrategy>().toExtend<Strategy<TestResourceAtlas, TestConfig>>();
  });

  it("different ResourceAtlas types should produce different Strategy types", () => {
    interface OtherResourceAtlas extends AnyResourceAtlas {
      other: { value: number };
    }
    class OtherStrategy extends Strategy<OtherResourceAtlas, TestConfig> {}

    expectTypeOf<TestStrategy>().not.toEqualTypeOf<OtherStrategy>();
  });

  it("different config types should produce different Strategy types", () => {
    class StringStrategy extends Strategy<TestResourceAtlas, string> {}
    class NumberStrategy extends Strategy<TestResourceAtlas, number> {}

    expectTypeOf<StringStrategy>().not.toEqualTypeOf<NumberStrategy>();
  });
});
