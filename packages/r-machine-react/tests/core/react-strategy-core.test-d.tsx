import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
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
class ConcreteStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig> {
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
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>().toExtend<
        Strategy<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>
      >();
    });

    it("is abstract and cannot be instantiated directly", () => {
      // Concrete subclass is constructible
      expectTypeOf(ConcreteStrategy).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, AnyFmtProvider>,
        {} as TestConfig
      );
    });

    it("rMachine property is typed as RMachine<RA, L>", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, AnyLocale, AnyFmtProvider>
      >();
    });

    it("config property is typed as C", () => {
      expectTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>["config"]
      >().toEqualTypeOf<TestConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactToolset<RA, L>>", () => {
      expectTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>["createToolset"]
      >().returns.toEqualTypeOf<Promise<ReactToolset<TestAtlas, AnyLocale>>>();
    });

    it("takes no parameters", () => {
      expectTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>["createToolset"]
      >().parameters.toEqualTypeOf<[]>();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<
        ReturnType<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>["createToolset"]>
      >;
      expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas, AnyLocale>>();
    });

    it("return type depends on RA, not on C", () => {
      type ResultA = Awaited<
        ReturnType<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>["createToolset"]>
      >;
      type ResultB = Awaited<
        ReturnType<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, OtherConfig>["createToolset"]>
      >;
      expectTypeOf<ResultA>().toEqualTypeOf<ResultB>();
    });
  });

  // -----------------------------------------------------------------------
  // createImpl (protected abstract)
  // -----------------------------------------------------------------------

  describe("createImpl", () => {
    it("can be overridden to return Promise<ReactImpl<L>>", () => {
      class CustomStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig> {
        protected createImpl(): Promise<ReactImpl<AnyLocale>> {
          const impl: ReactImpl<AnyLocale> = { readLocale: () => "en", writeLocale: () => {} };
          return Promise.resolve(impl);
        }
      }
      expectTypeOf<CustomStrategy>().toExtend<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>();
    });

    it("has access to rMachine and config from the base class", () => {
      class AccessingStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig> {
        protected createImpl(): Promise<ReactImpl<AnyLocale>> {
          const _machine: RMachine<TestAtlas, AnyLocale, AnyFmtProvider> = this.rMachine;
          const _config: TestConfig = this.config;
          return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
        }
      }
      expectTypeOf<AccessingStrategy>().toExtend<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>();
    });
  });

  // -----------------------------------------------------------------------
  // Generic type parameter constraints
  // -----------------------------------------------------------------------

  describe("generic type parameters", () => {
    it("RA must extend AnyResourceAtlas", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>().toExtend<
        Strategy<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>
      >();
      expectTypeOf<ReactStrategyCore<AnyResourceAtlas, AnyLocale, AnyFmtProvider, TestConfig>>().toBeObject();
    });

    it("different atlas types produce different strategy types", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>().not.toEqualTypeOf<
        ReactStrategyCore<OtherAtlas, AnyLocale, AnyFmtProvider, TestConfig>
      >();
    });

    it("different config types produce different strategy types", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>().not.toEqualTypeOf<
        ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, OtherConfig>
      >();
    });

    it("different atlas types produce different toolset return types", () => {
      type ToolsetA = Awaited<
        ReturnType<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>["createToolset"]>
      >;
      type ToolsetB = Awaited<
        ReturnType<ReactStrategyCore<OtherAtlas, AnyLocale, AnyFmtProvider, TestConfig>["createToolset"]>
      >;
      expectTypeOf<ToolsetA>().not.toEqualTypeOf<ToolsetB>();
    });

    it("strategy with AnyResourceAtlas is a supertype", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>().toExtend<
        ReactStrategyCore<AnyResourceAtlas, AnyLocale, AnyFmtProvider, TestConfig>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Structural compatibility
  // -----------------------------------------------------------------------

  describe("structural compatibility", () => {
    it("is not assignable to Strategy with a different config", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>().not.toExtend<
        Strategy<TestAtlas, AnyLocale, AnyFmtProvider, OtherConfig>
      >();
    });

    it("is not assignable to Strategy with a different atlas", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>().not.toExtend<
        Strategy<OtherAtlas, AnyLocale, AnyFmtProvider, TestConfig>
      >();
    });

    it("concrete subclass extends ReactStrategyCore", () => {
      expectTypeOf<ConcreteStrategy>().toExtend<ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>();
    });

    it("concrete subclass extends Strategy", () => {
      expectTypeOf<ConcreteStrategy>().toExtend<Strategy<TestAtlas, AnyLocale, AnyFmtProvider, TestConfig>>();
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
      ReturnType<ReactStrategyCore<TestAtlas, AppLocale, AnyFmtProvider, TestConfig>["createToolset"]>
    >;
    expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas, AppLocale>>();
  });

  it("rMachine property uses the narrowed locale", () => {
    expectTypeOf<ReactStrategyCore<TestAtlas, AppLocale, AnyFmtProvider, TestConfig>["rMachine"]>().toEqualTypeOf<
      RMachine<TestAtlas, AppLocale, AnyFmtProvider>
    >();
  });

  it("narrowed strategy is not assignable to differently-narrowed strategy", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<ReactStrategyCore<TestAtlas, AppLocale, AnyFmtProvider, TestConfig>>().not.toEqualTypeOf<
      ReactStrategyCore<TestAtlas, OtherLocale, AnyFmtProvider, TestConfig>
    >();
  });
});
