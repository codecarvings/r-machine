import { describe, expectTypeOf, it } from "vitest";
import type { AnyResAtlasInstance, RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
import { Strategy } from "../../src/strategy/strategy.js";

// Minimal atlas-instance shape for type testing. Strategy now generics on
// the atlas instance (gear / shell / res sub-maps), not the raw atlas map.
interface TestAtlas extends AnyResAtlasInstance {
  readonly gear: {};
  readonly shell: {};
  readonly res: {
    readonly common: { greeting: string };
    readonly errors: { notFound: string };
  };
}

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
class TestStrategy extends Strategy<TestAtlas, string, TestResKit, TestConfig> {}

describe("Strategy", () => {
  it("should be abstract and not directly constructable", () => {
    // @ts-expect-error - Strategy is abstract and cannot be instantiated directly
    new Strategy({} as RMachine<TestAtlas, string, {}>, {} as TestConfig);
  });

  it("should be constructable through subclasses", () => {
    expectTypeOf(TestStrategy).toBeConstructibleWith({} as RMachine<TestAtlas, string, TestResKit>, {
      option: "test",
      enabled: true,
    });
  });

  it("rMachine property should be readonly RMachine<ATLAS, L, KA>", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("rMachine");
    expectTypeOf<TestStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, string, TestResKit>>();

    const strategy = new TestStrategy({} as RMachine<TestAtlas, string, TestResKit>, {} as TestConfig);
    // @ts-expect-error - rMachine is readonly
    strategy.rMachine = {} as RMachine<TestAtlas, string, {}>;
  });

  it("config property should be readonly C", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("config");
    expectTypeOf<TestStrategy["config"]>().toEqualTypeOf<TestConfig>();

    const strategy = new TestStrategy({} as RMachine<TestAtlas, string, TestResKit>, {} as TestConfig);
    // @ts-expect-error - config is readonly
    strategy.config = {} as TestConfig;
  });

  it("constructor should accept RMachine and config parameters", () => {
    expectTypeOf(TestStrategy).constructorParameters.toEqualTypeOf<
      [rMachine: RMachine<TestAtlas, string, TestResKit>, config: TestConfig]
    >();
  });

  it("validateConfig should be a protected method overridable in subclasses", () => {
    class ValidatingStrategy extends Strategy<TestAtlas, string, TestResKit, TestConfig> {
      protected override validateConfig(): void {
        expectTypeOf(this.config).toEqualTypeOf<TestConfig>();
        expectTypeOf(this.rMachine).toEqualTypeOf<RMachine<TestAtlas, string, TestResKit>>();
      }
    }
    expectTypeOf<ValidatingStrategy>().toExtend<Strategy<TestAtlas, string, TestResKit, TestConfig>>();
  });

  it("should propagate locale type L between Strategy and RMachine", () => {
    class NarrowLocaleStrategy extends Strategy<TestAtlas, "en" | "it", TestResKit, TestConfig> {}
    expectTypeOf<NarrowLocaleStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, "en" | "it", TestResKit>>();
  });
});

describe("Strategy with different config types", () => {
  it("should preserve config type for primitives, nullish, and union types", () => {
    class StringConfig extends Strategy<AnyResAtlasInstance, string, TestResKit, string> {}
    class NumberConfig extends Strategy<AnyResAtlasInstance, string, TestResKit, number> {}
    class NullConfig extends Strategy<AnyResAtlasInstance, string, TestResKit, null> {}
    class UndefinedConfig extends Strategy<AnyResAtlasInstance, string, TestResKit, undefined> {}
    class UnionConfig extends Strategy<AnyResAtlasInstance, string, TestResKit, string | number> {}

    expectTypeOf<StringConfig["config"]>().toEqualTypeOf<string>();
    expectTypeOf<NumberConfig["config"]>().toEqualTypeOf<number>();
    expectTypeOf<NullConfig["config"]>().toEqualTypeOf<null>();
    expectTypeOf<UndefinedConfig["config"]>().toEqualTypeOf<undefined>();
    expectTypeOf<UnionConfig["config"]>().toEqualTypeOf<string | number>();
  });
});

describe("Strategy type constraints", () => {
  it("ATLAS should reject types that do not extend AnyResAtlasInstance", () => {
    // @ts-expect-error - number does not extend AnyResAtlasInstance
    class _InvalidATLAS extends Strategy<number, string, TestResKit, TestConfig> {}
  });

  it("L should reject types that do not extend AnyLocale", () => {
    // @ts-expect-error - number does not extend AnyLocale (string)
    class _InvalidL extends Strategy<TestAtlas, number, TestResKit, TestConfig> {}
  });

  it("L should accept AnyLocale and string literal unions", () => {
    expectTypeOf<Strategy<TestAtlas, AnyLocale, TestResKit, TestConfig>>().toBeObject();
    expectTypeOf<Strategy<TestAtlas, "en" | "it", TestResKit, TestConfig>>().toBeObject();
  });

  it("Strategy instances should extend Strategy base type", () => {
    expectTypeOf<TestStrategy>().toExtend<Strategy<TestAtlas, string, TestResKit, TestConfig>>();
  });

  it("different atlas instances should produce different Strategy types", () => {
    interface OtherAtlas extends AnyResAtlasInstance {
      readonly gear: {};
      readonly shell: {};
      readonly res: { readonly other: { value: number } };
    }
    class OtherStrategy extends Strategy<OtherAtlas, string, TestResKit, TestConfig> {}

    expectTypeOf<TestStrategy>().not.toEqualTypeOf<OtherStrategy>();
  });

  it("different config types should produce different Strategy types", () => {
    class StringStrategy extends Strategy<TestAtlas, string, TestResKit, string> {}
    class NumberStrategy extends Strategy<TestAtlas, string, TestResKit, number> {}

    expectTypeOf<StringStrategy>().not.toEqualTypeOf<NumberStrategy>();
  });

  it("different locale types should produce different Strategy types", () => {
    class EnOnlyStrategy extends Strategy<TestAtlas, "en", TestResKit, TestConfig> {}
    class EnItStrategy extends Strategy<TestAtlas, "en" | "it", TestResKit, TestConfig> {}

    expectTypeOf<EnOnlyStrategy>().not.toEqualTypeOf<EnItStrategy>();
  });

  it("should accept NamespaceMap as KA parameter", () => {
    type TestKA = { gear: { readonly c: "common" }; shell: { readonly c: "common" }; gate: { readonly c: "common" } };
    class KitStrategy extends Strategy<TestAtlas, string, TestKA, TestConfig> {}
    expectTypeOf<KitStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, string, TestKA>>();
  });
});
