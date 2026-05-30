import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import { describe, expectTypeOf, it } from "vitest";
import type { NextClientPlugKitMap, NextServerPlugKitMap, PathAtlasClass } from "#r-machine/next/core";
import type { NextAppClientRMachine, NextAppClientToolset, NextAppServerToolset } from "#r-machine/next/core/app";
import type {
  AnyNextAppOriginStrategyConfig,
  NextAppOriginStrategyConfig,
  NextAppOriginStrategyConfigParams,
  NextAppOriginStrategyCore,
} from "#r-machine/next/core/app/origin";
import { NextAppOriginStrategyCore as NextAppOriginStrategyCoreValue } from "#r-machine/next/core/app/origin";
import type { NextAppOriginStrategy } from "../../src/app/origin/next-app-origin-strategy.js";
import type { SimplePathAtlas, TestLocale, TranslatedPathAtlas } from "../_fixtures/constants.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type DefaultCKM = {};
type DefaultSKM = {};
type DefaultPA = InstanceType<(typeof NextAppOriginStrategyCoreValue)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppOriginStrategyCoreValue)["defaultConfig"]["localeKey"];

type Strat = NextAppOriginStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;

// ---------------------------------------------------------------------------
// NextAppOriginStrategy
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategy", () => {
  // -----------------------------------------------------------------------
  // Inheritance & class shape
  // -----------------------------------------------------------------------

  describe("inheritance & class shape", () => {
    it("extends NextAppOriginStrategyCore with the full config (not the Params variant)", () => {
      type FullConfig = NextAppOriginStrategyConfig<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;
      expectTypeOf<Strat>().toExtend<NextAppOriginStrategyCore<TestAtlas, TestLocale, E, EF, FullConfig>>();
      expectTypeOf<Strat["config"]>().toEqualTypeOf<FullConfig>();
      expectTypeOf<Strat["config"]>().not.toEqualTypeOf<
        NextAppOriginStrategyConfigParams<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("is not abstract (create factory exists)", () => {
      expectTypeOf<typeof NextAppOriginStrategy>().toHaveProperty("create");
    });
  });

  // -----------------------------------------------------------------------
  // create — static factory
  // -----------------------------------------------------------------------

  describe("create static factory", () => {
    type CreateFn = typeof NextAppOriginStrategy.create<
      TestAtlas,
      TestLocale,
      E,
      EF,
      DefaultCKM,
      DefaultSKM,
      DefaultPA,
      DefaultLK
    >;

    it("takes (RMachine, ConfigParams) and returns NextAppOriginStrategy", () => {
      expectTypeOf<CreateFn>().parameter(0).toEqualTypeOf<RMachine<TestAtlas, TestLocale, E, EF>>();
      expectTypeOf<CreateFn>()
        .parameter(1)
        .toEqualTypeOf<NextAppOriginStrategyConfigParams<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>>();
      expectTypeOf<ReturnType<CreateFn>>().toEqualTypeOf<Strat>();
    });

    it("config must include localeOriginMap", () => {
      type ConfigParam = Parameters<typeof NextAppOriginStrategy.create<TestAtlas, TestLocale, E, EF>>[1];
      expectTypeOf<ConfigParam>().toHaveProperty("localeOriginMap");
    });
  });

  // -----------------------------------------------------------------------
  // Public properties
  // -----------------------------------------------------------------------

  describe("public properties", () => {
    it("rMachine is RMachine<RA, L, E, EF>", () => {
      expectTypeOf<Strat["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, TestLocale, E, EF>>();
    });

    it("config.PathAtlas is PathAtlasClass<DefaultPA>", () => {
      expectTypeOf<Strat["config"]["PathAtlas"]>().toEqualTypeOf<PathAtlasClass<DefaultPA>>();
    });

    it("config.localeKey is DefaultLK", () => {
      expectTypeOf<Strat["config"]["localeKey"]>().toEqualTypeOf<DefaultLK>();
    });

    it("config.pathMatcher is RegExp | null", () => {
      expectTypeOf<Strat["config"]["pathMatcher"]>().toEqualTypeOf<RegExp | null>();
    });
  });

  // -----------------------------------------------------------------------
  // defaultConfig
  // -----------------------------------------------------------------------

  describe("defaultConfig", () => {
    it("inherits a static defaultConfig typed as AnyNextAppOriginStrategyConfig", () => {
      expectTypeOf(NextAppOriginStrategyCoreValue.defaultConfig).toExtend<AnyNextAppOriginStrategyConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // Toolset return types
  // -----------------------------------------------------------------------

  describe("toolset return types", () => {
    it("createClientToolset() takes no params and returns Promise<NextAppClientToolset>", () => {
      expectTypeOf<Strat["createClientToolset"]>().parameters.toEqualTypeOf<[]>();
      expectTypeOf<Strat["createClientToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, EF, DefaultCKM, DefaultPA>>
      >();
    });

    it("createServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<Strat["createServerToolset"]>().parameter(0).toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createServerToolset returns Promise<NextAppServerToolset>", () => {
      expectTypeOf<Strat["createServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, DefaultSKM, DefaultPA, DefaultLK>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PA is wired through to config.PathAtlas", () => {
      type StratPA = NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        E,
        EF,
        DefaultCKM,
        DefaultSKM,
        TranslatedPathAtlas,
        DefaultLK
      >;
      expectTypeOf<StratPA["config"]["PathAtlas"]>().toEqualTypeOf<PathAtlasClass<TranslatedPathAtlas>>();
    });

    it("custom LK is reflected in config.localeKey", () => {
      type StratLK = NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        E,
        EF,
        DefaultCKM,
        DefaultSKM,
        SimplePathAtlas,
        "lang"
      >;
      expectTypeOf<StratLK["config"]["localeKey"]>().toEqualTypeOf<"lang">();
    });

    it("custom PA affects client toolset return type", () => {
      type StratPA = NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        E,
        EF,
        DefaultCKM,
        DefaultSKM,
        TranslatedPathAtlas,
        DefaultLK
      >;
      expectTypeOf<StratPA["createClientToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, EF, DefaultCKM, TranslatedPathAtlas>>
      >();
    });

    it("custom LK affects server toolset return type", () => {
      type StratLK = NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        E,
        EF,
        DefaultCKM,
        DefaultSKM,
        SimplePathAtlas,
        "lang"
      >;
      expectTypeOf<StratLK["createServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, DefaultSKM, SimplePathAtlas, "lang">>
      >();
    });

    it("different RA produce different types", () => {
      interface OtherAtlas extends AnyResAtlas {
        readonly other: { readonly value: number };
      }
      type OtherE = ResEquipment<OtherAtlas>;
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppOriginStrategy<OtherAtlas, TestLocale, OtherE, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, OtherLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different PA produce different types", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, DefaultLK>
      >().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, TranslatedPathAtlas, DefaultLK>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "locale">
      >().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "lang">
      >();
    });

    it("different CKM produce different types", () => {
      type OtherCKM = NextClientPlugKitMap<TestAtlas>;
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, E, EF, OtherCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different SKM produce different types", () => {
      type OtherSKM = NextServerPlugKitMap<TestAtlas>;
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, OtherSKM, DefaultPA, DefaultLK>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("getPath returns string", () => {
      const strategy = null! as NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        E,
        EF,
        DefaultCKM,
        DefaultSKM,
        TranslatedPathAtlas,
        DefaultLK
      >;
      const result: string = (strategy as any).hrefHelper.getPath("en", "/about");
      expectTypeOf(result).toBeString();
    });

    it("getUrl returns string", () => {
      const strategy = null! as NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        E,
        EF,
        DefaultCKM,
        DefaultSKM,
        TranslatedPathAtlas,
        DefaultLK
      >;
      const result: string = (strategy as any).hrefHelper.getUrl("en", "/about");
      expectTypeOf(result).toBeString();
    });
  });

  // -----------------------------------------------------------------------
  // Type constraint violations
  // -----------------------------------------------------------------------

  describe("type constraint violations", () => {
    it("rejects non-AnyResAtlas as RA", () => {
      // @ts-expect-error - string does not satisfy AnyResAtlas
      type _Invalid = NextAppOriginStrategy<string, TestLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;
    });

    it("rejects non-AnyPathAtlas as PA", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppOriginStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, string, DefaultLK>;
    });

    it("rejects non-string as LK", () => {
      type _Invalid = NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        E,
        EF,
        DefaultCKM,
        DefaultSKM,
        SimplePathAtlas,
        // @ts-expect-error - number does not satisfy string constraint
        number
      >;
    });
  });
});
