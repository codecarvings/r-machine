import { describe, expectTypeOf, it } from "vitest";
import type { RMachine } from "#r-machine";
import type { AnyResAtlas } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import { Strategy } from "../../src/strategy/strategy.js";

type TestResAtlas = {
  readonly common: { greeting: string };
  readonly errors: { notFound: string };
};

interface TestConfig {
  option: string;
  enabled: boolean;
}

interface TestResKit {
  gear: {};
  shell: {};
  gate: {};
}

// Concrete implementation for type testing
class TestStrategy extends Strategy<TestResAtlas, string, TestResKit, TestConfig> {}

describe("Strategy", () => {
  it("should be abstract and not directly constructable", () => {
    // @ts-expect-error - Strategy is abstract and cannot be instantiated directly
    new Strategy({} as RMachine<TestResAtlas, string, {}>, {} as TestConfig);
  });

  it("should be constructable through subclasses", () => {
    expectTypeOf(TestStrategy).toBeConstructibleWith({} as RMachine<TestResAtlas, string, TestResKit>, {
      option: "test",
      enabled: true,
    });
  });

  it("rMachine property should be readonly RMachine<RA, L, KA>", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("rMachine");
    expectTypeOf<TestStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResAtlas, string, TestResKit>>();

    const strategy = new TestStrategy({} as RMachine<TestResAtlas, string, TestResKit>, {} as TestConfig);
    // @ts-expect-error - rMachine is readonly
    strategy.rMachine = {} as RMachine<TestResAtlas, string, {}>;
  });

  it("config property should be readonly C", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("config");
    expectTypeOf<TestStrategy["config"]>().toEqualTypeOf<TestConfig>();

    const strategy = new TestStrategy({} as RMachine<TestResAtlas, string, TestResKit>, {} as TestConfig);
    // @ts-expect-error - config is readonly
    strategy.config = {} as TestConfig;
  });

  it("constructor should accept RMachine and config parameters", () => {
    expectTypeOf(TestStrategy).constructorParameters.toEqualTypeOf<
      [rMachine: RMachine<TestResAtlas, string, TestResKit>, config: TestConfig]
    >();
  });

  it("validateConfig should be a protected method overridable in subclasses", () => {
    class ValidatingStrategy extends Strategy<TestResAtlas, string, TestResKit, TestConfig> {
      protected override validateConfig(): void {
        expectTypeOf(this.config).toEqualTypeOf<TestConfig>();
        expectTypeOf(this.rMachine).toEqualTypeOf<RMachine<TestResAtlas, string, TestResKit>>();
      }
    }
    expectTypeOf<ValidatingStrategy>().toExtend<Strategy<TestResAtlas, string, TestResKit, TestConfig>>();
  });

  it("should propagate locale type L between Strategy and RMachine", () => {
    class NarrowLocaleStrategy extends Strategy<TestResAtlas, "en" | "it", TestResKit, TestConfig> {}
    expectTypeOf<NarrowLocaleStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResAtlas, "en" | "it", TestResKit>>();
  });
});

describe("Strategy with different config types", () => {
  it("should preserve config type for primitives, nullish, and union types", () => {
    class StringConfig extends Strategy<AnyResAtlas, string, TestResKit, string> {}
    class NumberConfig extends Strategy<AnyResAtlas, string, TestResKit, number> {}
    class NullConfig extends Strategy<AnyResAtlas, string, TestResKit, null> {}
    class UndefinedConfig extends Strategy<AnyResAtlas, string, TestResKit, undefined> {}
    class UnionConfig extends Strategy<AnyResAtlas, string, TestResKit, string | number> {}

    expectTypeOf<StringConfig["config"]>().toEqualTypeOf<string>();
    expectTypeOf<NumberConfig["config"]>().toEqualTypeOf<number>();
    expectTypeOf<NullConfig["config"]>().toEqualTypeOf<null>();
    expectTypeOf<UndefinedConfig["config"]>().toEqualTypeOf<undefined>();
    expectTypeOf<UnionConfig["config"]>().toEqualTypeOf<string | number>();
  });
});

describe("Strategy type constraints", () => {
  it("RA should reject types that do not extend AnyResAtlas", () => {
    // @ts-expect-error - number does not extend AnyResAtlas
    class _InvalidRA extends Strategy<number, string, TestResKit, TestConfig> {}
  });

  it("L should reject types that do not extend AnyLocale", () => {
    // @ts-expect-error - number does not extend AnyLocale (string)
    class _InvalidL extends Strategy<TestResAtlas, number, TestResKit, TestConfig> {}
  });

  it("L should accept AnyLocale and string literal unions", () => {
    expectTypeOf<Strategy<TestResAtlas, AnyLocale, TestResKit, TestConfig>>().toBeObject();
    expectTypeOf<Strategy<TestResAtlas, "en" | "it", TestResKit, TestConfig>>().toBeObject();
  });

  it("Strategy instances should extend Strategy base type", () => {
    expectTypeOf<TestStrategy>().toExtend<Strategy<TestResAtlas, string, TestResKit, TestConfig>>();
  });

  it("different ResAtlas types should produce different Strategy types", () => {
    type OtherResAtlas = {
      readonly other: { value: number };
    };
    class OtherStrategy extends Strategy<OtherResAtlas, string, TestResKit, TestConfig> {}

    expectTypeOf<TestStrategy>().not.toEqualTypeOf<OtherStrategy>();
  });

  it("different config types should produce different Strategy types", () => {
    class StringStrategy extends Strategy<TestResAtlas, string, TestResKit, string> {}
    class NumberStrategy extends Strategy<TestResAtlas, string, TestResKit, number> {}

    expectTypeOf<StringStrategy>().not.toEqualTypeOf<NumberStrategy>();
  });

  it("different locale types should produce different Strategy types", () => {
    class EnOnlyStrategy extends Strategy<TestResAtlas, "en", TestResKit, TestConfig> {}
    class EnItStrategy extends Strategy<TestResAtlas, "en" | "it", TestResKit, TestConfig> {}

    expectTypeOf<EnOnlyStrategy>().not.toEqualTypeOf<EnItStrategy>();
  });

  it("should accept NamespaceMap as KA parameter", () => {
    type TestKA = { gear: { readonly c: "common" }; shell: { readonly c: "common" }; gate: { readonly c: "common" } };
    class KitStrategy extends Strategy<TestResAtlas, string, TestKA, TestConfig> {}
    expectTypeOf<KitStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestResAtlas, string, TestKA>>();
  });
});
