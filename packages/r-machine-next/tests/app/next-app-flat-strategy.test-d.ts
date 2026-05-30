import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { NextClientPlugKitMap, NextServerPlugKitMap, PathAtlasClass } from "#r-machine/next/core";
import type { NextAppClientRMachine, NextAppClientToolset, NextAppServerToolset } from "#r-machine/next/core/app";
import type {
  AnyNextAppFlatStrategyConfig,
  NextAppFlatStrategyConfig,
  NextAppFlatStrategyConfigParams,
  NextAppFlatStrategyCore,
} from "#r-machine/next/core/app/flat";
import type { NextAppFlatStrategy } from "../../src/app/flat/next-app-flat-strategy.js";
import type { SimplePathAtlas, TestLocale, TranslatedPathAtlas } from "../_fixtures/constants.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

// Consistent instantiation helpers — no internal type imports beyond what
// the public surface re-exports.
type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type DefaultCKM = {};
type DefaultSKM = {};

// Derive default PA / LK from the core (same pattern as the React test-d files).
import { NextAppFlatStrategyCore as NextAppFlatStrategyCoreValue } from "#r-machine/next/core/app/flat";

type DefaultPA = InstanceType<(typeof NextAppFlatStrategyCoreValue)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppFlatStrategyCoreValue)["defaultConfig"]["localeKey"];

type Strat = NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;

// ---------------------------------------------------------------------------
// NextAppFlatStrategy
// ---------------------------------------------------------------------------

describe("NextAppFlatStrategy", () => {
  // -----------------------------------------------------------------------
  // Inheritance & class shape
  // -----------------------------------------------------------------------

  describe("inheritance & class shape", () => {
    it("extends NextAppFlatStrategyCore with the full config (not the Params variant)", () => {
      type FullConfig = NextAppFlatStrategyConfig<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;
      expectTypeOf<Strat>().toExtend<NextAppFlatStrategyCore<TestAtlas, TestLocale, E, EF, FullConfig>>();
      expectTypeOf<Strat["config"]>().toEqualTypeOf<FullConfig>();
      expectTypeOf<Strat["config"]>().not.toEqualTypeOf<
        NextAppFlatStrategyConfigParams<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("is not abstract (create factory exists)", () => {
      expectTypeOf<typeof NextAppFlatStrategy>().toHaveProperty("create");
    });
  });

  // -----------------------------------------------------------------------
  // create — static factory
  // -----------------------------------------------------------------------

  describe("create static factory", () => {
    type CreateFn = typeof NextAppFlatStrategy.create<
      TestAtlas,
      TestLocale,
      E,
      EF,
      DefaultCKM,
      DefaultSKM,
      DefaultPA,
      DefaultLK
    >;

    it("takes (RMachine, ConfigParams) and returns NextAppFlatStrategy", () => {
      expectTypeOf<CreateFn>().parameter(0).toEqualTypeOf<RMachine<TestAtlas, TestLocale, E, EF>>();
      expectTypeOf<CreateFn>()
        .parameter(1)
        .toEqualTypeOf<NextAppFlatStrategyConfigParams<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>>();
      expectTypeOf<ReturnType<CreateFn>>().toEqualTypeOf<Strat>();
    });
  });

  // -----------------------------------------------------------------------
  // Public properties
  // -----------------------------------------------------------------------

  describe("public properties", () => {
    it("rMachine is RMachine<RA, L, E, EF>", () => {
      expectTypeOf<Strat["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, TestLocale, E, EF>>();
    });

    it("config.cookie is CookieDeclaration", () => {
      expectTypeOf<Strat["config"]["cookie"]>().toEqualTypeOf<CookieDeclaration>();
    });

    it("config.pathMatcher is RegExp | null", () => {
      expectTypeOf<Strat["config"]["pathMatcher"]>().toEqualTypeOf<RegExp | null>();
    });

    it("config.localeKey is DefaultLK", () => {
      expectTypeOf<Strat["config"]["localeKey"]>().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // defaultConfig
  // -----------------------------------------------------------------------

  describe("defaultConfig", () => {
    it("inherits a static defaultConfig typed as AnyNextAppFlatStrategyConfig", () => {
      expectTypeOf(NextAppFlatStrategyCoreValue.defaultConfig).toExtend<AnyNextAppFlatStrategyConfig>();
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
      type StratPA = NextAppFlatStrategy<
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
      type StratLK = NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "lang">;
      expectTypeOf<StratLK["config"]["localeKey"]>().toEqualTypeOf<"lang">();
    });

    it("custom PA affects client toolset return type", () => {
      type StratPA = NextAppFlatStrategy<
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
      type StratLK = NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "lang">;
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
        NextAppFlatStrategy<OtherAtlas, TestLocale, OtherE, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, OtherLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different PA produce different types", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, DefaultLK>
      >().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, TranslatedPathAtlas, DefaultLK>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "locale">
      >().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "lang">
      >();
    });

    it("different CKM produce different types", () => {
      type OtherCKM = NextClientPlugKitMap<TestAtlas>;
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, OtherCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different SKM produce different types", () => {
      type OtherSKM = NextServerPlugKitMap<TestAtlas>;
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, OtherSKM, DefaultPA, DefaultLK>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Type constraint violations
  // -----------------------------------------------------------------------

  describe("type constraint violations", () => {
    it("rejects non-AnyResAtlas as RA", () => {
      // @ts-expect-error - string does not satisfy AnyResAtlas
      type _Invalid = NextAppFlatStrategy<string, TestLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;
    });

    it("rejects non-AnyPathAtlas as PA", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, string, DefaultLK>;
    });

    it("rejects non-string as LK", () => {
      type _Invalid = NextAppFlatStrategy<
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
