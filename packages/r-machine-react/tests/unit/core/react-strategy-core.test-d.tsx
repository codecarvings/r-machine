import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { Strategy } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import { ReactStrategyCore } from "../../../src/core/react-strategy-core.js";
import type { ReactImpl, ReactToolset } from "../../../src/core/react-toolset.js";

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
class ConcreteStrategy extends ReactStrategyCore<TestAtlas, TestConfig> {
  protected createImpl(): Promise<ReactImpl> {
    return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
  }
}

// ---------------------------------------------------------------------------
// Class shape & inheritance
// ---------------------------------------------------------------------------

describe("ReactStrategyCore", () => {
  describe("class shape", () => {
    it("extends Strategy<RA, C>", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>>().toExtend<Strategy<TestAtlas, TestConfig>>();
    });

    it("is abstract and cannot be instantiated directly", () => {
      // Concrete subclass is constructible
      expectTypeOf(ConcreteStrategy).toBeConstructibleWith({} as RMachine<TestAtlas>, {} as TestConfig);
    });

    it("rMachine property is typed as RMachine<RA>", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas>>();
    });

    it("config property is typed as C", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>["config"]>().toEqualTypeOf<TestConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactToolset<RA>>", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>["createToolset"]>().returns.toEqualTypeOf<
        Promise<ReactToolset<TestAtlas>>
      >();
    });

    it("takes no parameters", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>["createToolset"]>().parameters.toEqualTypeOf<[]>();
    });

    it("is a function", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>["createToolset"]>().toBeFunction();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<ReturnType<ReactStrategyCore<TestAtlas, TestConfig>["createToolset"]>>;
      expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas>>();
    });

    it("return type depends on RA, not on C", () => {
      type ResultA = Awaited<ReturnType<ReactStrategyCore<TestAtlas, TestConfig>["createToolset"]>>;
      type ResultB = Awaited<ReturnType<ReactStrategyCore<TestAtlas, OtherConfig>["createToolset"]>>;
      expectTypeOf<ResultA>().toEqualTypeOf<ResultB>();
    });
  });

  // -----------------------------------------------------------------------
  // createImpl (protected abstract)
  // -----------------------------------------------------------------------

  describe("createImpl", () => {
    it("can be overridden to return Promise<ReactImpl>", () => {
      class CustomStrategy extends ReactStrategyCore<TestAtlas, TestConfig> {
        protected createImpl(): Promise<ReactImpl> {
          const impl: ReactImpl = { readLocale: () => "en", writeLocale: () => {} };
          return Promise.resolve(impl);
        }
      }
      expectTypeOf<CustomStrategy>().toExtend<ReactStrategyCore<TestAtlas, TestConfig>>();
    });

    it("has access to rMachine and config from the base class", () => {
      class AccessingStrategy extends ReactStrategyCore<TestAtlas, TestConfig> {
        protected createImpl(): Promise<ReactImpl> {
          const _machine: RMachine<TestAtlas> = this.rMachine;
          const _config: TestConfig = this.config;
          return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
        }
      }
      expectTypeOf<AccessingStrategy>().toExtend<ReactStrategyCore<TestAtlas, TestConfig>>();
    });
  });

  // -----------------------------------------------------------------------
  // Generic type parameter constraints
  // -----------------------------------------------------------------------

  describe("generic type parameters", () => {
    it("RA must extend AnyResourceAtlas", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>>().toExtend<Strategy<TestAtlas, TestConfig>>();
      expectTypeOf<ReactStrategyCore<AnyResourceAtlas, TestConfig>>().toBeObject();
    });

    it("C accepts any type", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, string>>().toBeObject();
      expectTypeOf<ReactStrategyCore<TestAtlas, number>>().toBeObject();
      expectTypeOf<ReactStrategyCore<TestAtlas, undefined>>().toBeObject();
      expectTypeOf<ReactStrategyCore<TestAtlas, null>>().toBeObject();
    });

    it("different atlas types produce different strategy types", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>>().not.toEqualTypeOf<
        ReactStrategyCore<OtherAtlas, TestConfig>
      >();
    });

    it("different config types produce different strategy types", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>>().not.toEqualTypeOf<
        ReactStrategyCore<TestAtlas, OtherConfig>
      >();
    });

    it("different atlas types produce different toolset return types", () => {
      type ToolsetA = Awaited<ReturnType<ReactStrategyCore<TestAtlas, TestConfig>["createToolset"]>>;
      type ToolsetB = Awaited<ReturnType<ReactStrategyCore<OtherAtlas, TestConfig>["createToolset"]>>;
      expectTypeOf<ToolsetA>().not.toEqualTypeOf<ToolsetB>();
    });

    it("strategy with AnyResourceAtlas is a supertype", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>>().toExtend<
        ReactStrategyCore<AnyResourceAtlas, TestConfig>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Structural compatibility
  // -----------------------------------------------------------------------

  describe("structural compatibility", () => {
    it("is not assignable to Strategy with a different config", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>>().not.toExtend<Strategy<TestAtlas, OtherConfig>>();
    });

    it("is not assignable to Strategy with a different atlas", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>>().not.toExtend<Strategy<OtherAtlas, TestConfig>>();
    });

    it("instances are assignable to their own type", () => {
      expectTypeOf<ReactStrategyCore<TestAtlas, TestConfig>>().toExtend<ReactStrategyCore<TestAtlas, TestConfig>>();
    });

    it("concrete subclass extends ReactStrategyCore", () => {
      expectTypeOf<ConcreteStrategy>().toExtend<ReactStrategyCore<TestAtlas, TestConfig>>();
    });

    it("concrete subclass extends Strategy", () => {
      expectTypeOf<ConcreteStrategy>().toExtend<Strategy<TestAtlas, TestConfig>>();
    });
  });
});
