import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { CustomLocaleDetector, CustomLocaleStore, Strategy } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import type {
  PartialReactStandardStrategyConfig,
  ReactStandardStrategyConfig,
  ReactStandardStrategyCore,
} from "../../../src/core/react-standard-strategy-core.js";
import type { ReactStrategyCore } from "../../../src/core/react-strategy-core.js";
import type { ReactToolset } from "../../../src/core/react-toolset.js";
import { ReactStandardStrategy } from "../../../src/lib/react-standard-strategy.js";

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

// ---------------------------------------------------------------------------
// ReactStandardStrategy — class shape & inheritance
// ---------------------------------------------------------------------------

describe("ReactStandardStrategy", () => {
  describe("class shape", () => {
    it("extends ReactStandardStrategyCore<RA>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().toExtend<ReactStandardStrategyCore<TestAtlas>>();
    });

    it("extends ReactStrategyCore<RA, ReactStandardStrategyConfig>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().toExtend<
        ReactStrategyCore<TestAtlas, ReactStandardStrategyConfig>
      >();
    });

    it("extends Strategy<RA, ReactStandardStrategyConfig>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().toExtend<Strategy<TestAtlas, ReactStandardStrategyConfig>>();
    });

    it("rMachine property is typed as RMachine<RA>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas>>();
    });

    it("config property is typed as full ReactStandardStrategyConfig (not partial)", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>["config"]>().toEqualTypeOf<ReactStandardStrategyConfig>();
      expectTypeOf<
        ReactStandardStrategy<TestAtlas>["config"]
      >().not.toEqualTypeOf<PartialReactStandardStrategyConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // constructor overloads
  // -----------------------------------------------------------------------

  describe("constructor overloads", () => {
    it("is constructible with only RMachine<RA>", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas>).toBeConstructibleWith({} as RMachine<TestAtlas>);
    });

    it("is constructible with RMachine<RA> and PartialReactStandardStrategyConfig", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas>).toBeConstructibleWith(
        {} as RMachine<TestAtlas>,
        {} as PartialReactStandardStrategyConfig
      );
    });

    it("accepts an empty object as partial config", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas>).toBeConstructibleWith({} as RMachine<TestAtlas>, {});
    });

    it("accepts a config with only localeDetector", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas>).toBeConstructibleWith({} as RMachine<TestAtlas>, {
        localeDetector: (() => "en") as CustomLocaleDetector,
      });
    });

    it("accepts a config with only localeStore", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas>).toBeConstructibleWith({} as RMachine<TestAtlas>, {
        localeStore: {} as CustomLocaleStore,
      });
    });

    it("first parameter must be RMachine<RA>", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas>).constructorParameters.toExtend<
        [rMachine: RMachine<TestAtlas>, ...args: unknown[]]
      >();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactToolset<RA>>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>["createToolset"]>().returns.toEqualTypeOf<
        Promise<ReactToolset<TestAtlas>>
      >();
    });

    it("takes no parameters", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>["createToolset"]>().parameters.toEqualTypeOf<[]>();
    });

    it("is a function", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>["createToolset"]>().toBeFunction();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<ReturnType<ReactStandardStrategy<TestAtlas>["createToolset"]>>;
      expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas>>();
    });
  });

  // -----------------------------------------------------------------------
  // static defaultConfig (inherited)
  // -----------------------------------------------------------------------

  describe("static defaultConfig", () => {
    it("is typed as ReactStandardStrategyConfig", () => {
      expectTypeOf(ReactStandardStrategy.defaultConfig).toEqualTypeOf<ReactStandardStrategyConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // generic type parameter constraints
  // -----------------------------------------------------------------------

  describe("generic type parameters", () => {
    it("RA must extend AnyResourceAtlas", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().toExtend<Strategy<TestAtlas, ReactStandardStrategyConfig>>();
      expectTypeOf<ReactStandardStrategy<AnyResourceAtlas>>().toBeObject();
    });

    it("different atlas types produce different strategy types", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().not.toEqualTypeOf<ReactStandardStrategy<OtherAtlas>>();
    });

    it("different atlas types produce different toolset return types", () => {
      type ToolsetA = Awaited<ReturnType<ReactStandardStrategy<TestAtlas>["createToolset"]>>;
      type ToolsetB = Awaited<ReturnType<ReactStandardStrategy<OtherAtlas>["createToolset"]>>;
      expectTypeOf<ToolsetA>().not.toEqualTypeOf<ToolsetB>();
    });

    it("strategy with AnyResourceAtlas is a supertype", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().toExtend<ReactStandardStrategy<AnyResourceAtlas>>();
    });
  });

  // -----------------------------------------------------------------------
  // structural compatibility
  // -----------------------------------------------------------------------

  describe("structural compatibility", () => {
    it("is not assignable to Strategy with a different config", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().not.toExtend<Strategy<TestAtlas, string>>();
    });

    it("is not assignable to Strategy with a different atlas", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().not.toExtend<
        Strategy<OtherAtlas, ReactStandardStrategyConfig>
      >();
    });

    it("is assignable to ReactStandardStrategyCore<RA>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().toExtend<ReactStandardStrategyCore<TestAtlas>>();
    });

    it("is structurally compatible with ReactStandardStrategyCore", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas>>().toExtend<ReactStandardStrategyCore<TestAtlas>>();
      expectTypeOf<ReactStandardStrategyCore<TestAtlas>>().toExtend<ReactStandardStrategy<TestAtlas>>();
    });
  });
});
