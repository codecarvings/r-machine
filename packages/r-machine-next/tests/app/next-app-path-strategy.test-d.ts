import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { NextClientPlugKitMap, NextServerPlugKitMap, PathAtlasClass } from "#r-machine/next/core";
import type {
  NextAppClientRMachine,
  NextAppClientToolset,
  NextAppNoProxyServerToolset,
  NextAppServerToolset,
} from "#r-machine/next/core/app";
import type {
  AnyNextAppPathStrategyConfig,
  NextAppPathStrategyConfig,
  NextAppPathStrategyConfigParams,
  NextAppPathStrategyCore,
} from "#r-machine/next/core/app/path";
import { NextAppPathStrategyCore as NextAppPathStrategyCoreValue } from "#r-machine/next/core/app/path";
import type { NextAppPathStrategy } from "../../src/app/path/next-app-path-strategy.js";
import type { SimplePathAtlas, TestLocale, TranslatedPathAtlas } from "../_fixtures/constants.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type DefaultCKM = {};
type DefaultSKM = {};
type DefaultPA = InstanceType<(typeof NextAppPathStrategyCoreValue)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppPathStrategyCoreValue)["defaultConfig"]["localeKey"];

type Strat = NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;

// ---------------------------------------------------------------------------
// NextAppPathStrategy
// ---------------------------------------------------------------------------

describe("NextAppPathStrategy", () => {
  // -----------------------------------------------------------------------
  // Inheritance & class shape
  // -----------------------------------------------------------------------

  describe("inheritance & class shape", () => {
    it("extends NextAppPathStrategyCore with the full config (not the Params variant)", () => {
      type FullConfig = NextAppPathStrategyConfig<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;
      expectTypeOf<Strat>().toExtend<NextAppPathStrategyCore<TestAtlas, TestLocale, E, EF, FullConfig>>();
      expectTypeOf<Strat["config"]>().toEqualTypeOf<FullConfig>();
      expectTypeOf<Strat["config"]>().not.toEqualTypeOf<
        NextAppPathStrategyConfigParams<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("is not abstract (create factory exists)", () => {
      expectTypeOf<typeof NextAppPathStrategy>().toHaveProperty("create");
    });
  });

  // -----------------------------------------------------------------------
  // create — static factory
  // -----------------------------------------------------------------------

  describe("create static factory", () => {
    type CreateFn = typeof NextAppPathStrategy.create<
      TestAtlas,
      TestLocale,
      E,
      EF,
      DefaultCKM,
      DefaultSKM,
      DefaultPA,
      DefaultLK
    >;

    it("takes (RMachine, ConfigParams) and returns NextAppPathStrategy", () => {
      expectTypeOf<CreateFn>().parameter(0).toEqualTypeOf<RMachine<TestAtlas, TestLocale, E, EF>>();
      expectTypeOf<CreateFn>()
        .parameter(1)
        .toEqualTypeOf<NextAppPathStrategyConfigParams<TestAtlas, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>>();
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

    it("config.cookie is CookieOption", () => {
      type CookieOption = "on" | "off" | CookieDeclaration;
      expectTypeOf<Strat["config"]["cookie"]>().toEqualTypeOf<CookieOption>();
    });

    it("config.localeLabel is LocaleLabelOption", () => {
      expectTypeOf<Strat["config"]["localeLabel"]>().toEqualTypeOf<"strict" | "lowercase">();
    });

    it("config.autoLocaleBinding is SwitchableOption", () => {
      expectTypeOf<Strat["config"]["autoLocaleBinding"]>().toEqualTypeOf<"on" | "off">();
    });

    it("config.basePath is string", () => {
      expectTypeOf<Strat["config"]["basePath"]>().toEqualTypeOf<string>();
    });

    it("config.autoDetectLocale includes custom object form", () => {
      type CustomAutoDetectLocale = { readonly pathMatcher: RegExp | null };
      expectTypeOf<{ readonly pathMatcher: null }>().toExtend<Strat["config"]["autoDetectLocale"]>();
      expectTypeOf<CustomAutoDetectLocale>().toExtend<Strat["config"]["autoDetectLocale"]>();
    });

    it("config.autoDetectLocale accepts 'on' and 'off' string values", () => {
      expectTypeOf<"on">().toExtend<Strat["config"]["autoDetectLocale"]>();
      expectTypeOf<"off">().toExtend<Strat["config"]["autoDetectLocale"]>();
    });

    it("config.implicitDefaultLocale includes custom object form", () => {
      type CustomImplicitDefaultLocale = { readonly pathMatcher: RegExp | null };
      expectTypeOf<CustomImplicitDefaultLocale>().toExtend<Strat["config"]["implicitDefaultLocale"]>();
    });

    it("config.implicitDefaultLocale accepts 'on' and 'off' string values", () => {
      expectTypeOf<"on">().toExtend<Strat["config"]["implicitDefaultLocale"]>();
      expectTypeOf<"off">().toExtend<Strat["config"]["implicitDefaultLocale"]>();
    });
  });

  // -----------------------------------------------------------------------
  // defaultConfig
  // -----------------------------------------------------------------------

  describe("defaultConfig", () => {
    it("inherits a static defaultConfig typed as AnyNextAppPathStrategyConfig", () => {
      expectTypeOf(NextAppPathStrategyCoreValue.defaultConfig).toExtend<AnyNextAppPathStrategyConfig>();
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

    it("createNoProxyServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<Strat["createNoProxyServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createNoProxyServerToolset returns Promise<NextAppNoProxyServerToolset>", () => {
      expectTypeOf<Strat["createNoProxyServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppNoProxyServerToolset<TestAtlas, TestLocale, DefaultSKM, DefaultPA, DefaultLK>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PA is wired through to config.PathAtlas", () => {
      type StratPA = NextAppPathStrategy<
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
      type StratLK = NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "lang">;
      expectTypeOf<StratLK["config"]["localeKey"]>().toEqualTypeOf<"lang">();
    });

    it("custom PA affects client toolset return type", () => {
      type StratPA = NextAppPathStrategy<
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
      type StratLK = NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "lang">;
      expectTypeOf<StratLK["createServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, DefaultSKM, SimplePathAtlas, "lang">>
      >();
    });

    it("custom PA+LK affects no-proxy server toolset return type", () => {
      type StratBoth = NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        E,
        EF,
        DefaultCKM,
        DefaultSKM,
        TranslatedPathAtlas,
        "lang"
      >;
      expectTypeOf<StratBoth["createNoProxyServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppNoProxyServerToolset<TestAtlas, TestLocale, DefaultSKM, TranslatedPathAtlas, "lang">>
      >();
    });

    it("different RA produce different types", () => {
      interface OtherAtlas extends AnyResAtlas {
        readonly other: { readonly value: number };
      }
      type OtherE = ResEquipment<OtherAtlas>;
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppPathStrategy<OtherAtlas, TestLocale, OtherE, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, OtherLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different PA produce different types", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, DefaultLK>
      >().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, TranslatedPathAtlas, DefaultLK>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "locale">
      >().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, SimplePathAtlas, "lang">
      >();
    });

    it("different CKM produce different types", () => {
      type OtherCKM = NextClientPlugKitMap<TestAtlas>;
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, E, EF, OtherCKM, DefaultSKM, DefaultPA, DefaultLK>
      >();
    });

    it("different SKM produce different types", () => {
      type OtherSKM = NextServerPlugKitMap<TestAtlas>;
      expectTypeOf<Strat>().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, OtherSKM, DefaultPA, DefaultLK>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("getPath returns string", () => {
      const strategy = null! as NextAppPathStrategy<
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

    it("does not have getUrl property (unlike origin strategy)", () => {
      // hrefHelper is protected; access via indexed type
      expectTypeOf<
        NonNullable<
          NextAppPathStrategy<
            TestAtlas,
            TestLocale,
            E,
            EF,
            DefaultCKM,
            DefaultSKM,
            TranslatedPathAtlas,
            DefaultLK
          >["hrefHelper"]
        >
      >().not.toHaveProperty("getUrl");
    });
  });

  // -----------------------------------------------------------------------
  // Type constraint violations
  // -----------------------------------------------------------------------

  describe("type constraint violations", () => {
    it("rejects non-AnyResAtlas as RA", () => {
      // @ts-expect-error - string does not satisfy AnyResAtlas
      type _Invalid = NextAppPathStrategy<string, TestLocale, E, EF, DefaultCKM, DefaultSKM, DefaultPA, DefaultLK>;
    });

    it("rejects non-AnyPathAtlas as PA", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppPathStrategy<TestAtlas, TestLocale, E, EF, DefaultCKM, DefaultSKM, string, DefaultLK>;
    });

    it("rejects non-string as LK", () => {
      type _Invalid = NextAppPathStrategy<
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
