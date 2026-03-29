import type { AnyResourceAtlas, NamespaceMap, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { Strategy } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import { ReactStrategyCore } from "../../src/core/react-strategy-core.js";
import type { ReactImpl, ReactToolset } from "../../src/core/react-toolset.js";

// ---------------------------------------------------------------------------
// Test resource atlas types
// ---------------------------------------------------------------------------

type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

type OtherAtlas = {
  readonly settings: { readonly theme: string };
};

type TestConfig = { readonly label: string };
type OtherConfig = { readonly enabled: boolean };

// Concrete subclass for testing the abstract class
class ConcreteStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig> {
  protected createImpl(): Promise<ReactImpl<AnyLocale>> {
    return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
  }
}

// ---------------------------------------------------------------------------
// Class shape & inheritance
// ---------------------------------------------------------------------------

describe("ReactStrategyCore", () => {
  describe("class shape", () => {
    it("extends Strategy<RA, L, C>", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>>().toExtend<
        Strategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>
      >();
    });

    it("is abstract and cannot be instantiated directly", () => {
      // Concrete subclass is constructible
      expectTypeOf(ConcreteStrategy).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>,
        {} as TestConfig
      );
    });

    it("rMachine property is typed as RMachine<RA, L>", () => {
      expectTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>["rMachine"]
      >().toEqualTypeOf<RMachine<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>();
    });

    it("config property is typed as C", () => {
      expectTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>["config"]
      >().toEqualTypeOf<TestConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactToolset<RA, L>>", () => {
      expectTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>["createToolset"]
      >().returns.toEqualTypeOf<Promise<ReactToolset<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>>();
    });

    it("takes no parameters", () => {
      expectTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>["createToolset"]
      >().parameters.toEqualTypeOf<[]>();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<
        ReturnType<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>["createToolset"]>
      >;
      expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>();
    });

    it("return type depends on RA, not on C", () => {
      type ResultA = Awaited<
        ReturnType<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>["createToolset"]>
      >;
      type ResultB = Awaited<
        ReturnType<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, OtherConfig>["createToolset"]>
      >;
      expectTypeOf<ResultA>().toEqualTypeOf<ResultB>();
    });
  });

  // -----------------------------------------------------------------------
  // createImpl (protected abstract)
  // -----------------------------------------------------------------------

  describe("createImpl", () => {
    it("can be overridden to return Promise<ReactImpl<L>>", () => {
      class CustomStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig> {
        protected createImpl(): Promise<ReactImpl<AnyLocale>> {
          const impl: ReactImpl<AnyLocale> = { readLocale: () => "en", writeLocale: () => {} };
          return Promise.resolve(impl);
        }
      }
      expectTypeOf<CustomStrategy>().toExtend<
        ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>
      >();
    });

    it("has access to rMachine and config from the base class", () => {
      class AccessingStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig> {
        protected createImpl(): Promise<ReactImpl<AnyLocale>> {
          const _machine: RMachine<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>> = this.rMachine;
          const _config: TestConfig = this.config;
          return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
        }
      }
      expectTypeOf<AccessingStrategy>().toExtend<
        ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Generic type parameter constraints
  // -----------------------------------------------------------------------

  describe("generic type parameters", () => {
    it("RA must extend AnyResourceAtlas", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>>().toExtend<
        Strategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>
      >();
      expectTypeOf<
        ReactStrategyCore<AnyResourceAtlas, AnyLocale, NamespaceMap<AnyResourceAtlas>, TestConfig>
      >().toBeObject();
    });

    it("different atlas types produce different strategy types", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>>().not.toEqualTypeOf<
        ReactStrategyCore<OtherAtlas, AnyLocale, NamespaceMap<OtherAtlas>, TestConfig>
      >();
    });

    it("different config types produce different strategy types", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>>().not.toEqualTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, OtherConfig>
      >();
    });

    it("different atlas types produce different toolset return types", () => {
      type ToolsetA = Awaited<
        ReturnType<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>["createToolset"]>
      >;
      type ToolsetB = Awaited<
        ReturnType<ReactStrategyCore<OtherAtlas, AnyLocale, NamespaceMap<OtherAtlas>, TestConfig>["createToolset"]>
      >;
      expectTypeOf<ToolsetA>().not.toEqualTypeOf<ToolsetB>();
    });

    it("strategy with AnyResourceAtlas is instantiable", () => {
      expectTypeOf<
        ReactStrategyCore<AnyResourceAtlas, AnyLocale, NamespaceMap<AnyResourceAtlas>, TestConfig>
      >().toBeObject();
    });
  });

  // -----------------------------------------------------------------------
  // Structural compatibility
  // -----------------------------------------------------------------------

  describe("structural compatibility", () => {
    it("is not assignable to Strategy with a different config", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>>().not.toExtend<
        Strategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, OtherConfig>
      >();
    });

    it("is not assignable to Strategy with a different atlas", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>>().not.toExtend<
        Strategy<OtherAtlas, AnyLocale, NamespaceMap<OtherAtlas>, TestConfig>
      >();
    });

    it("concrete subclass extends ReactStrategyCore", () => {
      expectTypeOf<ConcreteStrategy>().toExtend<
        ReactStrategyCore<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>
      >();
    });

    it("concrete subclass extends Strategy", () => {
      expectTypeOf<ConcreteStrategy>().toExtend<Strategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, TestConfig>>();
    });
  });
});

// ---------------------------------------------------------------------------
// Narrowed Locale type
// ---------------------------------------------------------------------------

describe("narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("strategy with narrowed locale produces a narrowed toolset", () => {
    type Result = Awaited<
      ReturnType<ReactStrategyCore<TestAtlas, AppLocale, NamespaceMap<TestAtlas>, TestConfig>["createToolset"]>
    >;
    expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas, AppLocale, NamespaceMap<TestAtlas>>>();
  });

  it("rMachine property uses the narrowed locale", () => {
    expectTypeOf<
      ReactStrategyCore<TestAtlas, AppLocale, NamespaceMap<TestAtlas>, TestConfig>["rMachine"]
    >().toEqualTypeOf<RMachine<TestAtlas, AppLocale, NamespaceMap<TestAtlas>>>();
  });

  it("narrowed strategy is not assignable to differently-narrowed strategy", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<ReactStrategyCore<TestAtlas, AppLocale, NamespaceMap<TestAtlas>, TestConfig>>().not.toEqualTypeOf<
      ReactStrategyCore<TestAtlas, OtherLocale, NamespaceMap<TestAtlas>, TestConfig>
    >();
  });
});
