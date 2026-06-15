import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment, SwitchableOption } from "r-machine/core";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasClass } from "#r-machine/next/core";
import type {
  AnyNextAppFlatStrategyConfig,
  NextAppFlatStrategyConfig,
  NextAppFlatStrategyConfigParams,
} from "../../../../src/core/app/flat/next-app-flat-strategy-core.js";
import { NextAppFlatStrategyCore } from "../../../../src/core/app/flat/next-app-flat-strategy-core.js";
import type { SimplePathAtlas, TestLocale } from "../../../_fixtures/constants.js";
import type { TestAtlas } from "../../../_fixtures/mock-machine.js";

type CKM = typeof NextAppFlatStrategyCore.defaultConfig.clientKit;
type SKM = typeof NextAppFlatStrategyCore.defaultConfig.serverKit;
type EF = ExperimentalFlags;

// ---------------------------------------------------------------------------
// NextAppFlatStrategyConfig
// ---------------------------------------------------------------------------

describe("NextAppFlatStrategyConfig", () => {
  type Config = NextAppFlatStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">;

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
      | "cookie"
      | "pathMatcher"
    >();
  });

  it("PathAtlas is PathAtlasClass<SimplePathAtlas>", () => {
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

  it("cookie is CookieDeclaration", () => {
    expectTypeOf<Config["cookie"]>().toEqualTypeOf<CookieDeclaration>();
  });

  it("pathMatcher is RegExp | null", () => {
    expectTypeOf<Config["pathMatcher"]>().toEqualTypeOf<RegExp | null>();
  });

  it("all properties are readonly", () => {
    expectTypeOf<Readonly<Config>>().toEqualTypeOf<Config>();
  });
});

// ---------------------------------------------------------------------------
// AnyNextAppFlatStrategyConfig
// ---------------------------------------------------------------------------

describe("AnyNextAppFlatStrategyConfig", () => {
  it("has all expected properties", () => {
    expectTypeOf<AnyNextAppFlatStrategyConfig>().toHaveProperty("PathAtlas");
    expectTypeOf<AnyNextAppFlatStrategyConfig>().toHaveProperty("localeKey");
    expectTypeOf<AnyNextAppFlatStrategyConfig>().toHaveProperty("autoLocaleBinding");
    expectTypeOf<AnyNextAppFlatStrategyConfig>().toHaveProperty("basePath");
    expectTypeOf<AnyNextAppFlatStrategyConfig>().toHaveProperty("cookie");
    expectTypeOf<AnyNextAppFlatStrategyConfig>().toHaveProperty("pathMatcher");
  });

  it("is assignable from a concrete NextAppFlatStrategyConfig", () => {
    expectTypeOf<
      NextAppFlatStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">
    >().toExtend<AnyNextAppFlatStrategyConfig>();
  });
});

// ---------------------------------------------------------------------------
// NextAppFlatStrategyConfigParams
// ---------------------------------------------------------------------------

describe("NextAppFlatStrategyConfigParams", () => {
  type Config = NextAppFlatStrategyConfigParams<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">;

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
      | "cookie"
      | "pathMatcher"
    >();
  });

  it("all properties are optional", () => {
    expectTypeOf<{}>().toExtend<Config>();
  });

  it("cookie is optional and accepts CookieDeclaration", () => {
    expectTypeOf<CookieDeclaration>().toExtend<NonNullable<Config["cookie"]>>();
  });

  it("pathMatcher is optional and accepts RegExp | null", () => {
    expectTypeOf<{}>().toExtend<Config>();
    expectTypeOf<{ pathMatcher: RegExp }>().toExtend<Config>();
    expectTypeOf<{ pathMatcher: null }>().toExtend<Config>();
  });

  it("all properties are readonly", () => {
    expectTypeOf<Readonly<Config>>().toEqualTypeOf<Config>();
  });
});

// ---------------------------------------------------------------------------
// NextAppFlatStrategyCore
// ---------------------------------------------------------------------------

describe("NextAppFlatStrategyCore", () => {
  type SimpleConfig = NextAppFlatStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "locale">;

  it("defaultConfig extends the parent defaultConfig with flat-specific properties", () => {
    expectTypeOf(NextAppFlatStrategyCore.defaultConfig).toHaveProperty("cookie");
    expectTypeOf(NextAppFlatStrategyCore.defaultConfig).toHaveProperty("pathMatcher");
    expectTypeOf(NextAppFlatStrategyCore.defaultConfig).toHaveProperty("PathAtlas");
  });

  it("rMachine is RMachine<RA>", () => {
    expectTypeOf<
      NextAppFlatStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>["rMachine"]
    >().toEqualTypeOf<RMachine<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF>>();
  });

  it("config preserves the concrete config type parameter", () => {
    expectTypeOf<
      NextAppFlatStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>["config"]
    >().toEqualTypeOf<SimpleConfig>();
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("has readonly getPath property", () => {
      type Helper = NextAppFlatStrategyCore<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        EF,
        SimpleConfig
      >["hrefHelper"];
      expectTypeOf<Helper>().toHaveProperty("getPath");
    });

    it("does not have getUrl property", () => {
      type Helper = NextAppFlatStrategyCore<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        EF,
        SimpleConfig
      >["hrefHelper"];
      expectTypeOf<Helper>().not.toHaveProperty("getUrl");
    });

    it("getPath is a function that returns string", () => {
      type GetPath = NextAppFlatStrategyCore<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        EF,
        SimpleConfig
      >["hrefHelper"]["getPath"];
      expectTypeOf<GetPath>().toBeFunction();
      expectTypeOf<ReturnType<GetPath>>().toBeString();
    });
  });

  it("is abstract and cannot be instantiated directly", () => {
    // An abstract class is not assignable to a concrete `new (...)` signature.
    // (A positive `abstract new (...)` extend check is unreliable here because
    // the class also carries static members like `defaultConfig`.)
    expectTypeOf<typeof NextAppFlatStrategyCore>().not.toExtend<new (...args: any[]) => any>();
  });

  it("different RA produce different core types", () => {
    interface OtherAtlas extends AnyResAtlas {
      readonly other: { readonly value: number };
    }
    expectTypeOf<
      NextAppFlatStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >().not.toEqualTypeOf<
      NextAppFlatStrategyCore<OtherAtlas, TestLocale, ResEquipment<OtherAtlas>, EF, SimpleConfig>
    >();
  });

  it("different L produce different core types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<
      NextAppFlatStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >().not.toEqualTypeOf<NextAppFlatStrategyCore<TestAtlas, OtherLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>>();
  });

  it("different config types produce different core types", () => {
    type OtherConfig = NextAppFlatStrategyConfig<TestAtlas, CKM, SKM, SimplePathAtlas, "lang">;
    expectTypeOf<
      NextAppFlatStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >().not.toEqualTypeOf<NextAppFlatStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, OtherConfig>>();
  });

  it("different KM produce different core types", () => {
    type OtherE = ResEquipment<TestAtlas> & { readonly __km: "other" };
    expectTypeOf<
      NextAppFlatStrategyCore<TestAtlas, TestLocale, ResEquipment<TestAtlas>, EF, SimpleConfig>
    >().not.toEqualTypeOf<NextAppFlatStrategyCore<TestAtlas, TestLocale, OtherE, EF, SimpleConfig>>();
  });
});
