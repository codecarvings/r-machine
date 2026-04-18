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

interface TestResEquipment {
  readonly gear: {};
  readonly shell: {};
  readonly gate: {};
  readonly bridgeGears: readonly [];
}

// Concrete implementation for type testing
class TestStrategy extends Strategy<TestAtlas, string, TestResEquipment, TestConfig> {}

describe("Strategy", () => {
  it("should be abstract and not directly constructable", () => {
    // @ts-expect-error - Strategy is abstract and cannot be instantiated directly
    new Strategy({} as RMachine<TestAtlas, string, {}>, {} as TestConfig);
  });

  it("should be constructable through subclasses", () => {
    expectTypeOf(TestStrategy).toBeConstructibleWith({} as RMachine<TestAtlas, string, TestResEquipment>, {
      option: "test",
      enabled: true,
    });
  });

  it("rMachine property should be readonly RMachine<ATLAS, L, KA>", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("rMachine");
    expectTypeOf<TestStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, string, TestResEquipment>>();

    const strategy = new TestStrategy({} as RMachine<TestAtlas, string, TestResEquipment>, {} as TestConfig);
    // @ts-expect-error - rMachine is readonly
    strategy.rMachine = {} as RMachine<TestAtlas, string, {}>;
  });

  it("config property should be readonly C", () => {
    expectTypeOf<TestStrategy>().toHaveProperty("config");
    expectTypeOf<TestStrategy["config"]>().toEqualTypeOf<TestConfig>();

    const strategy = new TestStrategy({} as RMachine<TestAtlas, string, TestResEquipment>, {} as TestConfig);
    // @ts-expect-error - config is readonly
    strategy.config = {} as TestConfig;
  });

  it("constructor should accept RMachine and config parameters", () => {
    expectTypeOf(TestStrategy).constructorParameters.toEqualTypeOf<
      [rMachine: RMachine<TestAtlas, string, TestResEquipment>, config: TestConfig]
    >();
  });

  it("validateConfig should be a protected method overridable in subclasses", () => {
    class ValidatingStrategy extends Strategy<TestAtlas, string, TestResEquipment, TestConfig> {
      protected override validateConfig(): void {
        expectTypeOf(this.config).toEqualTypeOf<TestConfig>();
        expectTypeOf(this.rMachine).toEqualTypeOf<RMachine<TestAtlas, string, TestResEquipment>>();
      }
    }
    expectTypeOf<ValidatingStrategy>().toExtend<Strategy<TestAtlas, string, TestResEquipment, TestConfig>>();
  });

  it("should propagate locale type L between Strategy and RMachine", () => {
    class NarrowLocaleStrategy extends Strategy<TestAtlas, "en" | "it", TestResEquipment, TestConfig> {}
    expectTypeOf<NarrowLocaleStrategy["rMachine"]>().toEqualTypeOf<
      RMachine<TestAtlas, "en" | "it", TestResEquipment>
    >();
  });
});

describe("Strategy with different config types", () => {
  it("should preserve config type for primitives, nullish, and union types", () => {
    class StringConfig extends Strategy<AnyResAtlasInstance, string, TestResEquipment, string> {}
    class NumberConfig extends Strategy<AnyResAtlasInstance, string, TestResEquipment, number> {}
    class NullConfig extends Strategy<AnyResAtlasInstance, string, TestResEquipment, null> {}
    class UndefinedConfig extends Strategy<AnyResAtlasInstance, string, TestResEquipment, undefined> {}
    class UnionConfig extends Strategy<AnyResAtlasInstance, string, TestResEquipment, string | number> {}

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
    class _InvalidATLAS extends Strategy<number, string, TestResEquipment, TestConfig> {}
  });

  it("L should reject types that do not extend AnyLocale", () => {
    // @ts-expect-error - number does not extend AnyLocale (string)
    class _InvalidL extends Strategy<TestAtlas, number, TestResEquipment, TestConfig> {}
  });

  it("L should accept AnyLocale and string literal unions", () => {
    expectTypeOf<Strategy<TestAtlas, AnyLocale, TestResEquipment, TestConfig>>().toBeObject();
    expectTypeOf<Strategy<TestAtlas, "en" | "it", TestResEquipment, TestConfig>>().toBeObject();
  });

  it("Strategy instances should extend Strategy base type", () => {
    expectTypeOf<TestStrategy>().toExtend<Strategy<TestAtlas, string, TestResEquipment, TestConfig>>();
  });

  it("different atlas instances should produce different Strategy types", () => {
    interface OtherAtlas extends AnyResAtlasInstance {
      readonly gear: {};
      readonly shell: {};
      readonly res: { readonly other: { value: number } };
    }
    class OtherStrategy extends Strategy<OtherAtlas, string, TestResEquipment, TestConfig> {}

    expectTypeOf<TestStrategy>().not.toEqualTypeOf<OtherStrategy>();
  });

  it("different config types should produce different Strategy types", () => {
    class StringStrategy extends Strategy<TestAtlas, string, TestResEquipment, string> {}
    class NumberStrategy extends Strategy<TestAtlas, string, TestResEquipment, number> {}

    expectTypeOf<StringStrategy>().not.toEqualTypeOf<NumberStrategy>();
  });

  it("different locale types should produce different Strategy types", () => {
    class EnOnlyStrategy extends Strategy<TestAtlas, "en", TestResEquipment, TestConfig> {}
    class EnItStrategy extends Strategy<TestAtlas, "en" | "it", TestResEquipment, TestConfig> {}

    expectTypeOf<EnOnlyStrategy>().not.toEqualTypeOf<EnItStrategy>();
  });

  it("should accept NamespaceMap as KA parameter", () => {
    type TestK = {
      readonly gear: { readonly c: "common" };
      readonly shell: { readonly c: "common" };
      readonly gate: { readonly c: "common" };
      readonly bridgeGears: readonly [];
    };
    class KitStrategy extends Strategy<TestAtlas, string, TestK, TestConfig> {}
    expectTypeOf<KitStrategy["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, string, TestK>>();
  });
});
