import { describe, expectTypeOf, it } from "vitest";
import type { AnyResourceAtlas, RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
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
class TestStrategy extends Strategy<TestResourceAtlas, string, TestConfig> {}

describe("Strategy", () => {
  it("should be abstract and not directly constructable", () => {
    // @ts-expect-error - Strategy is abstract and cannot be instantiated directly
    new Strategy({} as RMachine<TestResourceAtlas, string>, {} as TestConfig);
  });

  it("should be constructable through subclasses", () => {
    expectTypeOf(TestStrategy).toBeConstructibleWith({} as RMachine<TestResourceAtlas, string>, {
      option: "test",
      enabled: true,
    });
  });

  it("rMachine property should be readonly RMachine<RA, L>", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("rMachine");
    expectTypeOf<TestStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResourceAtlas, string>>();

    const strategy = new TestStrategy({} as RMachine<TestResourceAtlas, string>, {} as TestConfig);
    // @ts-expect-error - rMachine is readonly
    strategy.rMachine = {} as RMachine<TestResourceAtlas, string>;
  });

  it("config property should be readonly C", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("config");
    expectTypeOf<TestStrategy["config"]>().toEqualTypeOf<TestConfig>();

    const strategy = new TestStrategy({} as RMachine<TestResourceAtlas, string>, {} as TestConfig);
    // @ts-expect-error - config is readonly
    strategy.config = {} as TestConfig;
  });

  it("constructor should accept RMachine and config parameters", () => {
    expectTypeOf(TestStrategy).constructorParameters.toEqualTypeOf<
      [rMachine: RMachine<TestResourceAtlas, string>, config: TestConfig]
    >();
  });

  it("validateConfig should be a protected method overridable in subclasses", () => {
    class ValidatingStrategy extends Strategy<TestResourceAtlas, string, TestConfig> {
      protected override validateConfig(): void {
        expectTypeOf(this.config).toEqualTypeOf<TestConfig>();
        expectTypeOf(this.rMachine).toEqualTypeOf<RMachine<TestResourceAtlas, string>>();
      }
    }
    expectTypeOf<ValidatingStrategy>().toExtend<Strategy<TestResourceAtlas, string, TestConfig>>();
  });

  it("should propagate locale type L between Strategy and RMachine", () => {
    class NarrowLocaleStrategy extends Strategy<TestResourceAtlas, "en" | "it", TestConfig> {}
    expectTypeOf<NarrowLocaleStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResourceAtlas, "en" | "it">>();
  });
});

describe("Strategy with different config types", () => {
  it("should work with string config", () => {
    class StringConfigStrategy extends Strategy<AnyResourceAtlas, string, string> {}
    expectTypeOf<StringConfigStrategy["config"]>().toEqualTypeOf<string>();
  });

  it("should work with number config", () => {
    class NumberConfigStrategy extends Strategy<AnyResourceAtlas, string, number> {}
    expectTypeOf<NumberConfigStrategy["config"]>().toEqualTypeOf<number>();
  });

  it("should work with null config", () => {
    class NullConfigStrategy extends Strategy<AnyResourceAtlas, string, null> {}
    expectTypeOf<NullConfigStrategy["config"]>().toEqualTypeOf<null>();
  });

  it("should work with undefined config", () => {
    class UndefinedConfigStrategy extends Strategy<AnyResourceAtlas, string, undefined> {}
    expectTypeOf<UndefinedConfigStrategy["config"]>().toEqualTypeOf<undefined>();
  });

  it("should work with union config type", () => {
    class UnionConfigStrategy extends Strategy<AnyResourceAtlas, string, string | number> {}
    expectTypeOf<UnionConfigStrategy["config"]>().toEqualTypeOf<string | number>();
  });
});

describe("Strategy type constraints", () => {
  it("RA should reject types that do not extend AnyResourceAtlas", () => {
    // @ts-expect-error - number does not extend AnyResourceAtlas
    class _InvalidRA extends Strategy<number, string, TestConfig> {}
  });

  it("L should reject types that do not extend AnyLocale", () => {
    // @ts-expect-error - number does not extend AnyLocale (string)
    class _InvalidL extends Strategy<TestResourceAtlas, number, TestConfig> {}
  });

  it("L should accept AnyLocale and string literal unions", () => {
    expectTypeOf<Strategy<TestResourceAtlas, AnyLocale, TestConfig>>().toBeObject();
    expectTypeOf<Strategy<TestResourceAtlas, "en" | "it", TestConfig>>().toBeObject();
  });

  it("Strategy instances should extend Strategy base type", () => {
    expectTypeOf<TestStrategy>().toExtend<Strategy<TestResourceAtlas, string, TestConfig>>();
  });

  it("different ResourceAtlas types should produce different Strategy types", () => {
    interface OtherResourceAtlas extends AnyResourceAtlas {
      other: { value: number };
    }
    class OtherStrategy extends Strategy<OtherResourceAtlas, string, TestConfig> {}

    expectTypeOf<TestStrategy>().not.toEqualTypeOf<OtherStrategy>();
  });

  it("different config types should produce different Strategy types", () => {
    class StringStrategy extends Strategy<TestResourceAtlas, string, string> {}
    class NumberStrategy extends Strategy<TestResourceAtlas, string, number> {}

    expectTypeOf<StringStrategy>().not.toEqualTypeOf<NumberStrategy>();
  });

  it("different locale types should produce different Strategy types", () => {
    class EnOnlyStrategy extends Strategy<TestResourceAtlas, "en", TestConfig> {}
    class EnItStrategy extends Strategy<TestResourceAtlas, "en" | "it", TestConfig> {}

    expectTypeOf<EnOnlyStrategy>().not.toEqualTypeOf<EnItStrategy>();
  });
});
