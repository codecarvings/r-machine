import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment, SwitchableOption } from "r-machine/core";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, HrefTranslator, PathAtlasClass, PathParamMap, PathSelector } from "#r-machine/next/core";
import type {
  AnyNextAppOriginStrategyConfig,
  LocaleOriginMap,
  NextAppOriginStrategyConfig,
  NextAppOriginStrategyConfigParams,
} from "../../../../src/core/app/origin/next-app-origin-strategy-core.js";
import {
  NextAppOriginStrategyCore,
  NextAppOriginStrategyUrlTranslator,
} from "../../../../src/core/app/origin/next-app-origin-strategy-core.js";
import type { SimplePathAtlas, TestLocale, TranslatedPathAtlas } from "../../../_fixtures/constants.js";
import type { TestAtlas } from "../../../_fixtures/mock-machine.js";

type CKM = typeof NextAppOriginStrategyCore.defaultConfig.clientKit;
type SKM = typeof NextAppOriginStrategyCore.defaultConfig.serverKit;
type EF = ExperimentalFlags;

// ---------------------------------------------------------------------------
// LocaleOriginMap
// ---------------------------------------------------------------------------

describe("LocaleOriginMap", () => {
  it("accepts string values", () => {
    expectTypeOf<{ en: "https://en.example.com" }>().toExtend<LocaleOriginMap>();
  });

  it("accepts string array values", () => {
    expectTypeOf<{ en: ["https://en.example.com", "https://en2.example.com"] }>().toExtend<LocaleOriginMap>();
  });

  it("accepts a mix of string and string array values", () => {
    expectTypeOf<{
      en: "https://en.example.com";
      it: ["https://it.example.com", "https://it2.example.com"];
    }>().toExtend<LocaleOriginMap>();
  });

  it("has readonly index signature", () => {
    expectTypeOf<Readonly<LocaleOriginMap>>().toEqualTypeOf<LocaleOriginMap>();
  });
});

// ---------------------------------------------------------------------------
// NextAppOriginStrategyConfig
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategyConfig", () => {
  type Config = NextAppOriginStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "clientKit"
      | "serverKit"
      | "PathAtlas"
      | "localeKey"
      | "autoLocaleBinding"
      | "basePath"
      | "reactCompiler"
      | "localeOriginMap"
      | "pathMatcher"
    >();
  });

  it("PathAtlas is PathAtlasClass<PAD>", () => {
    expectTypeOf<Config["PathAtlas"]>().toEqualTypeOf<PathAtlasClass<SimplePathAtlas>>();
  });

  it("localeKey is the literal string type", () => {
    expectTypeOf<Config["localeKey"]>().toEqualTypeOf<"locale">();
  });

  it("autoLocaleBinding is SwitchableOption", () => {
    expectTypeOf<Config["autoLocaleBinding"]>().toEqualTypeOf<SwitchableOption>();
  });

  it("basePath is string", () => {
    expectTypeOf<Config["basePath"]>().toBeString();
  });

  it("localeOriginMap is LocaleOriginMap", () => {
    expectTypeOf<Config["localeOriginMap"]>().toEqualTypeOf<LocaleOriginMap>();
  });

  it("pathMatcher is RegExp | null", () => {
    expectTypeOf<Config["pathMatcher"]>().toEqualTypeOf<RegExp | null>();
  });

  it("all properties are readonly", () => {
    expectTypeOf<Readonly<Config>>().toEqualTypeOf<Config>();
  });
});

// ---------------------------------------------------------------------------
// AnyNextAppOriginStrategyConfig
// ---------------------------------------------------------------------------

describe("AnyNextAppOriginStrategyConfig", () => {
  it("has all expected properties", () => {
    expectTypeOf<AnyNextAppOriginStrategyConfig>().toHaveProperty("PathAtlas");
    expectTypeOf<AnyNextAppOriginStrategyConfig>().toHaveProperty("localeKey");
    expectTypeOf<AnyNextAppOriginStrategyConfig>().toHaveProperty("autoLocaleBinding");
    expectTypeOf<AnyNextAppOriginStrategyConfig>().toHaveProperty("basePath");
    expectTypeOf<AnyNextAppOriginStrategyConfig>().toHaveProperty("localeOriginMap");
    expectTypeOf<AnyNextAppOriginStrategyConfig>().toHaveProperty("pathMatcher");
  });

  it("is assignable from a concrete NextAppOriginStrategyConfig", () => {
    expectTypeOf<
      NextAppOriginStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">
    >().toExtend<AnyNextAppOriginStrategyConfig>();
  });
});

// ---------------------------------------------------------------------------
// NextAppOriginStrategyConfigParams
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategyConfigParams", () => {
  type Config = NextAppOriginStrategyConfigParams<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "clientKit"
      | "serverKit"
      | "PathAtlas"
      | "localeKey"
      | "autoLocaleBinding"
      | "basePath"
      | "reactCompiler"
      | "localeOriginMap"
      | "pathMatcher"
    >();
  });

  it("localeOriginMap is required", () => {
    expectTypeOf<Config["localeOriginMap"]>().toEqualTypeOf<LocaleOriginMap>();
  });

  it("inherited properties are optional", () => {
    expectTypeOf<{ localeOriginMap: LocaleOriginMap }>().toExtend<Config>();
  });

  it("pathMatcher is optional", () => {
    expectTypeOf<{ localeOriginMap: LocaleOriginMap }>().toExtend<Config>();
    expectTypeOf<{ localeOriginMap: LocaleOriginMap; pathMatcher: RegExp }>().toExtend<Config>();
    expectTypeOf<{ localeOriginMap: LocaleOriginMap; pathMatcher: null }>().toExtend<Config>();
  });

  it("all properties are readonly", () => {
    expectTypeOf<Readonly<Config>>().toEqualTypeOf<Config>();
  });
});

// ---------------------------------------------------------------------------
// NextAppOriginStrategyCore
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategyCore", () => {
  type SimpleConfig = NextAppOriginStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">;

  it("defaultConfig extends the parent defaultConfig with origin-specific properties", () => {
    expectTypeOf(NextAppOriginStrategyCore.defaultConfig).toHaveProperty("localeOriginMap");
    expectTypeOf(NextAppOriginStrategyCore.defaultConfig).toHaveProperty("pathMatcher");
    expectTypeOf(NextAppOriginStrategyCore.defaultConfig).toHaveProperty("PathAtlas");
  });

  it("rMachine is RMachine<RA>", () => {
    expectTypeOf<
      NextAppOriginStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>["rMachine"]
    >().toEqualTypeOf<RMachine<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF>>();
  });

  it("config is C", () => {
    expectTypeOf<
      NextAppOriginStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>["config"]
    >().toEqualTypeOf<SimpleConfig>();
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("has readonly getPath and getUrl properties", () => {
      type Helper = NextAppOriginStrategyCore<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        EF,
        SimpleConfig
      >["hrefHelper"];
      expectTypeOf<Helper>().toHaveProperty("getPath");
      expectTypeOf<Helper>().toHaveProperty("getUrl");
    });

    it("getPath is a function", () => {
      type GetPath = NextAppOriginStrategyCore<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        EF,
        SimpleConfig
      >["hrefHelper"]["getPath"];
      expectTypeOf<GetPath>().toBeFunction();
    });

    it("getUrl is a function", () => {
      type GetUrl = NextAppOriginStrategyCore<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        EF,
        SimpleConfig
      >["hrefHelper"]["getUrl"];
      expectTypeOf<GetUrl>().toBeFunction();
    });

    describe("with TranslatedPathAtlas", () => {
      it("path selector type narrows to declared paths", () => {
        type Paths = PathSelector<TranslatedPathAtlas>;
        expectTypeOf<"/">().toExtend<Paths>();
        expectTypeOf<"/about">().toExtend<Paths>();
        expectTypeOf<"/products">().toExtend<Paths>();
        expectTypeOf<"/products/[id]">().toExtend<Paths>();
      });

      it("path selector rejects undeclared paths", () => {
        type Paths = PathSelector<TranslatedPathAtlas>;
        expectTypeOf<"/nonexistent">().not.toExtend<Paths>();
        expectTypeOf<"/about/nested">().not.toExtend<Paths>();
      });

      it("params are required for dynamic paths", () => {
        type Params = PathParamMap<"/products/[id]">;
        expectTypeOf<keyof Params>().toEqualTypeOf<"id">();
        expectTypeOf<Params["id"]>().toBeString();
      });

      it("params are empty for static paths", () => {
        type Params = PathParamMap<"/about">;
        expectTypeOf<keyof Params>().toEqualTypeOf<never>();
      });
    });

    describe("with SimplePathAtlas", () => {
      it("path selector only allows root path", () => {
        type Paths = PathSelector<SimplePathAtlas>;
        expectTypeOf<"/">().toExtend<Paths>();
      });
    });
  });

  it("different RA produce different core types", () => {
    interface OtherAtlas extends AnyResAtlas {
      readonly other: { readonly value: number };
    }
    expectTypeOf<
      NextAppOriginStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >().not.toEqualTypeOf<
      NextAppOriginStrategyCore<OtherAtlas, TestLocale, ResEquipment<OtherAtlas>, EF, SimpleConfig>
    >();
  });

  it("different L produce different core types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<
      NextAppOriginStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >().not.toEqualTypeOf<
      NextAppOriginStrategyCore<TestAtlas, OtherLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >();
  });

  it("different config types produce different core types", () => {
    type OtherConfig = NextAppOriginStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "lang">;
    expectTypeOf<
      NextAppOriginStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >().not.toEqualTypeOf<NextAppOriginStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, OtherConfig>>();
  });

  it("different KM produce different core types", () => {
    type OtherE = ResEquipment<TestAtlas> & { readonly __km: "other" };
    expectTypeOf<
      NextAppOriginStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >().not.toEqualTypeOf<NextAppOriginStrategyCore<TestAtlas, TestLocale, OtherE, EF, SimpleConfig>>();
  });
});

// ---------------------------------------------------------------------------
// NextAppOriginStrategyUrlTranslator
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategyUrlTranslator", () => {
  it("is constructible with (AnyPathAtlas, readonly string[], string, LocaleOriginMap)", () => {
    expectTypeOf(NextAppOriginStrategyUrlTranslator).toBeConstructibleWith(
      {} as AnyPathAtlas,
      ["en", "it"] as const,
      "en",
      { en: "https://en.example.com", it: "https://it.example.com" }
    );
  });

  it("extends HrefTranslator", () => {
    expectTypeOf<NextAppOriginStrategyUrlTranslator>().toExtend<HrefTranslator>();
  });
});
