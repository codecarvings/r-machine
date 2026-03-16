import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { CustomLocaleDetector, CustomLocaleStore, Strategy } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import type {
  PartialReactStandardStrategyConfig,
  ReactStandardStrategyConfig,
  ReactStandardStrategyCore,
  ReactToolset,
} from "#r-machine/react/core";
import { ReactStandardStrategy } from "../../src/lib/react-standard-strategy.js";

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
    it("extends ReactStandardStrategyCore<RA, L>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>>().toExtend<
        ReactStandardStrategyCore<TestAtlas, AnyLocale>
      >();
    });

    it("rMachine property is typed as RMachine<RA, L>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, AnyLocale>
      >();
    });

    it("config property is typed as full ReactStandardStrategyConfig (not partial)", () => {
      expectTypeOf<
        ReactStandardStrategy<TestAtlas, AnyLocale>["config"]
      >().toEqualTypeOf<ReactStandardStrategyConfig>();
      expectTypeOf<
        ReactStandardStrategy<TestAtlas, AnyLocale>["config"]
      >().not.toEqualTypeOf<PartialReactStandardStrategyConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // constructor overloads
  // -----------------------------------------------------------------------

  describe("constructor overloads", () => {
    it("is constructible with only RMachine<RA, L>", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale>
      );
    });

    it("is constructible with RMachine<RA, L> and PartialReactStandardStrategyConfig", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale>,
        {} as PartialReactStandardStrategyConfig
      );
    });

    it("accepts an empty object as partial config", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale>,
        {}
      );
    });

    it("accepts a config with only localeDetector", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale>,
        {
          localeDetector: (() => "en") as CustomLocaleDetector,
        }
      );
    });

    it("accepts a config with only localeStore", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale>,
        {
          localeStore: {} as CustomLocaleStore,
        }
      );
    });

    it("first parameter must be RMachine<RA, L>", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale>).constructorParameters.toExtend<
        [rMachine: RMachine<TestAtlas, AnyLocale>, ...args: unknown[]]
      >();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactToolset<RA, L>>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>["createToolset"]>().returns.toEqualTypeOf<
        Promise<ReactToolset<TestAtlas, AnyLocale>>
      >();
    });

    it("takes no parameters", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>["createToolset"]>().parameters.toEqualTypeOf<[]>();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<ReturnType<ReactStandardStrategy<TestAtlas, AnyLocale>["createToolset"]>>;
      expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas, AnyLocale>>();
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
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>>().toExtend<
        Strategy<TestAtlas, AnyLocale, ReactStandardStrategyConfig>
      >();
      expectTypeOf<ReactStandardStrategy<AnyResourceAtlas, AnyLocale>>().toBeObject();
    });

    it("different atlas types produce different strategy types", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>>().not.toEqualTypeOf<
        ReactStandardStrategy<OtherAtlas, AnyLocale>
      >();
    });

    it("different atlas types produce different toolset return types", () => {
      type ToolsetA = Awaited<ReturnType<ReactStandardStrategy<TestAtlas, AnyLocale>["createToolset"]>>;
      type ToolsetB = Awaited<ReturnType<ReactStandardStrategy<OtherAtlas, AnyLocale>["createToolset"]>>;
      expectTypeOf<ToolsetA>().not.toEqualTypeOf<ToolsetB>();
    });

    it("strategy with AnyResourceAtlas is a supertype", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>>().toExtend<
        ReactStandardStrategy<AnyResourceAtlas, AnyLocale>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // structural compatibility
  // -----------------------------------------------------------------------

  describe("structural compatibility", () => {
    it("is not assignable to Strategy with a different config", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>>().not.toExtend<
        Strategy<TestAtlas, AnyLocale, string>
      >();
    });

    it("is not assignable to Strategy with a different atlas", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>>().not.toExtend<
        Strategy<OtherAtlas, AnyLocale, ReactStandardStrategyConfig>
      >();
    });

    it("is assignable to ReactStandardStrategyCore<RA, L>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>>().toExtend<
        ReactStandardStrategyCore<TestAtlas, AnyLocale>
      >();
    });

    it("is structurally compatible with ReactStandardStrategyCore", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale>>().toExtend<
        ReactStandardStrategyCore<TestAtlas, AnyLocale>
      >();
      expectTypeOf<ReactStandardStrategyCore<TestAtlas, AnyLocale>>().toExtend<
        ReactStandardStrategy<TestAtlas, AnyLocale>
      >();
    });
  });
});

// ---------------------------------------------------------------------------
// Narrowed Locale type
// ---------------------------------------------------------------------------

describe("narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("strategy with narrowed locale produces a narrowed toolset", () => {
    type Result = Awaited<ReturnType<ReactStandardStrategy<TestAtlas, AppLocale>["createToolset"]>>;
    expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas, AppLocale>>();
  });

  it("is constructible with narrowed-locale RMachine", () => {
    expectTypeOf(ReactStandardStrategy<TestAtlas, AppLocale>).toBeConstructibleWith(
      {} as RMachine<TestAtlas, AppLocale>
    );
  });

  it("narrowed strategy is not assignable to differently-narrowed strategy", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<ReactStandardStrategy<TestAtlas, AppLocale>>().not.toEqualTypeOf<
      ReactStandardStrategy<TestAtlas, OtherLocale>
    >();
  });
});
