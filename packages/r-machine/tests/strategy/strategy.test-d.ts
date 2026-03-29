import { describe, expectTypeOf, it } from "vitest";
import type { AnyResourceAtlas, RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
import { Strategy } from "../../src/strategy/strategy.js";

type TestResourceAtlas = {
  readonly common: { greeting: string };
  readonly errors: { notFound: string };
};

// Test config type
interface TestConfig {
  option: string;
  enabled: boolean;
}

// Concrete implementation for type testing
class TestStrategy extends Strategy<TestResourceAtlas, string, {}, TestConfig> {}

describe("Strategy", () => {
  it("should be abstract and not directly constructable", () => {
    // @ts-expect-error - Strategy is abstract and cannot be instantiated directly
    new Strategy({} as RMachine<TestResourceAtlas, string, {}>, {} as TestConfig);
  });

  it("should be constructable through subclasses", () => {
    expectTypeOf(TestStrategy).toBeConstructibleWith({} as RMachine<TestResourceAtlas, string, {}>, {
      option: "test",
      enabled: true,
    });
  });

  it("rMachine property should be readonly RMachine<RA, L, KA>", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("rMachine");
    expectTypeOf<TestStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResourceAtlas, string, {}>>();

    const strategy = new TestStrategy({} as RMachine<TestResourceAtlas, string, {}>, {} as TestConfig);
    // @ts-expect-error - rMachine is readonly
    strategy.rMachine = {} as RMachine<TestResourceAtlas, string, {}>;
  });

  it("config property should be readonly C", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("config");
    expectTypeOf<TestStrategy["config"]>().toEqualTypeOf<TestConfig>();

    const strategy = new TestStrategy({} as RMachine<TestResourceAtlas, string, {}>, {} as TestConfig);
    // @ts-expect-error - config is readonly
    strategy.config = {} as TestConfig;
  });

  it("constructor should accept RMachine and config parameters", () => {
    expectTypeOf(TestStrategy).constructorParameters.toEqualTypeOf<
      [rMachine: RMachine<TestResourceAtlas, string, {}>, config: TestConfig]
    >();
  });

  it("validateConfig should be a protected method overridable in subclasses", () => {
    class ValidatingStrategy extends Strategy<TestResourceAtlas, string, {}, TestConfig> {
      protected override validateConfig(): void {
        expectTypeOf(this.config).toEqualTypeOf<TestConfig>();
        expectTypeOf(this.rMachine).toEqualTypeOf<RMachine<TestResourceAtlas, string, {}>>();
      }
    }
    expectTypeOf<ValidatingStrategy>().toExtend<Strategy<TestResourceAtlas, string, {}, TestConfig>>();
  });

  it("should propagate locale type L between Strategy and RMachine", () => {
    class NarrowLocaleStrategy extends Strategy<TestResourceAtlas, "en" | "it", {}, TestConfig> {}
    expectTypeOf<NarrowLocaleStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResourceAtlas, "en" | "it", {}>>();
  });
});

describe("Strategy with different config types", () => {
  it("should preserve config type for primitives, nullish, and union types", () => {
    class StringConfig extends Strategy<AnyResourceAtlas, string, {}, string> {}
    class NumberConfig extends Strategy<AnyResourceAtlas, string, {}, number> {}
    class NullConfig extends Strategy<AnyResourceAtlas, string, {}, null> {}
    class UndefinedConfig extends Strategy<AnyResourceAtlas, string, {}, undefined> {}
    class UnionConfig extends Strategy<AnyResourceAtlas, string, {}, string | number> {}

    expectTypeOf<StringConfig["config"]>().toEqualTypeOf<string>();
    expectTypeOf<NumberConfig["config"]>().toEqualTypeOf<number>();
    expectTypeOf<NullConfig["config"]>().toEqualTypeOf<null>();
    expectTypeOf<UndefinedConfig["config"]>().toEqualTypeOf<undefined>();
    expectTypeOf<UnionConfig["config"]>().toEqualTypeOf<string | number>();
  });
});

describe("Strategy type constraints", () => {
  it("RA should reject types that do not extend AnyResourceAtlas", () => {
    // @ts-expect-error - number does not extend AnyResourceAtlas
    class _InvalidRA extends Strategy<number, string, {}, TestConfig> {}
  });

  it("L should reject types that do not extend AnyLocale", () => {
    // @ts-expect-error - number does not extend AnyLocale (string)
    class _InvalidL extends Strategy<TestResourceAtlas, number, {}, TestConfig> {}
  });

  it("L should accept AnyLocale and string literal unions", () => {
    expectTypeOf<Strategy<TestResourceAtlas, AnyLocale, {}, TestConfig>>().toBeObject();
    expectTypeOf<Strategy<TestResourceAtlas, "en" | "it", {}, TestConfig>>().toBeObject();
  });

  it("Strategy instances should extend Strategy base type", () => {
    expectTypeOf<TestStrategy>().toExtend<Strategy<TestResourceAtlas, string, {}, TestConfig>>();
  });

  it("different ResourceAtlas types should produce different Strategy types", () => {
    type OtherResourceAtlas = {
      readonly other: { value: number };
    };
    class OtherStrategy extends Strategy<OtherResourceAtlas, string, {}, TestConfig> {}

    expectTypeOf<TestStrategy>().not.toEqualTypeOf<OtherStrategy>();
  });

  it("different config types should produce different Strategy types", () => {
    class StringStrategy extends Strategy<TestResourceAtlas, string, {}, string> {}
    class NumberStrategy extends Strategy<TestResourceAtlas, string, {}, number> {}

    expectTypeOf<StringStrategy>().not.toEqualTypeOf<NumberStrategy>();
  });

  it("different locale types should produce different Strategy types", () => {
    class EnOnlyStrategy extends Strategy<TestResourceAtlas, "en", {}, TestConfig> {}
    class EnItStrategy extends Strategy<TestResourceAtlas, "en" | "it", {}, TestConfig> {}

    expectTypeOf<EnOnlyStrategy>().not.toEqualTypeOf<EnItStrategy>();
  });

  it("should accept NamespaceMap as KA parameter", () => {
    type TestKA = { readonly c: "common" };
    class KitStrategy extends Strategy<TestResourceAtlas, string, TestKA, TestConfig> {}
    expectTypeOf<KitStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResourceAtlas, string, TestKA>>();
  });
});
