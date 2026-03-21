import type { AnyFmtProvider, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
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

// ---------------------------------------------------------------------------
// ReactStandardStrategy — class shape & inheritance
// ---------------------------------------------------------------------------

describe("ReactStandardStrategy", () => {
  describe("class shape", () => {
    it("extends ReactStandardStrategyCore<RA, L>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>>().toExtend<
        ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>
      >();
    });

    it("rMachine property is typed as RMachine<RA, L>", () => {
      expectTypeOf<ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, AnyLocale, AnyFmtProvider>
      >();
    });

    it("config property is typed as full ReactStandardStrategyConfig (not partial)", () => {
      expectTypeOf<
        ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>["config"]
      >().toEqualTypeOf<ReactStandardStrategyConfig>();
      expectTypeOf<
        ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>["config"]
      >().not.toEqualTypeOf<PartialReactStandardStrategyConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // constructor overloads
  // -----------------------------------------------------------------------

  describe("constructor overloads", () => {
    it("is constructible with only RMachine<RA, L>", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, AnyFmtProvider>
      );
    });

    it("is constructible with RMachine<RA, L> and PartialReactStandardStrategyConfig", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, AnyFmtProvider>,
        {} as PartialReactStandardStrategyConfig
      );
    });

    it("accepts an empty object as partial config", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, AnyFmtProvider>,
        {}
      );
    });

    it("accepts a config with only localeDetector", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, AnyFmtProvider>,
        {
          localeDetector: (() => "en") as CustomLocaleDetector,
        }
      );
    });

    it("accepts a config with only localeStore", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, AnyFmtProvider>,
        {
          localeStore: {} as CustomLocaleStore,
        }
      );
    });

    it("first parameter must be RMachine<RA, L>", () => {
      expectTypeOf(ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>).constructorParameters.toExtend<
        [rMachine: RMachine<TestAtlas, AnyLocale, AnyFmtProvider>, ...args: unknown[]]
      >();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactToolset<RA, L>>", () => {
      expectTypeOf<
        ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>["createToolset"]
      >().returns.toEqualTypeOf<Promise<ReactToolset<TestAtlas, AnyLocale>>>();
    });

    it("takes no parameters", () => {
      expectTypeOf<
        ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>["createToolset"]
      >().parameters.toEqualTypeOf<[]>();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<ReturnType<ReactStandardStrategy<TestAtlas, AnyLocale, AnyFmtProvider>["createToolset"]>>;
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
});
