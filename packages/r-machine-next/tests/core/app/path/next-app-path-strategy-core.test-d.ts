import type { AnyFmtProvider, EmptyFmtProvider, RMachine } from "r-machine";
import type { SwitchableOption } from "r-machine/strategy";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlasProvider,
  HrefCanonicalizer,
  HrefTranslator,
  PathAtlasProviderCtor,
  PathParamMap,
  PathSelector,
} from "#r-machine/next/core";
import type {
  AnyNextAppPathStrategyConfig,
  NextAppPathStrategyConfig,
  PartialNextAppPathStrategyConfig,
} from "../../../../src/core/app/path/next-app-path-strategy-core.js";
import {
  NextAppPathStrategyCore,
  NextAppPathStrategyPathCanonicalizer,
  NextAppPathStrategyPathTranslator,
} from "../../../../src/core/app/path/next-app-path-strategy-core.js";
import type { SimplePathAtlas, TestLocale, TranslatedPathAtlas } from "../../../_fixtures/constants.js";
import type { TestAtlas } from "../../../_fixtures/mock-machine.js";

type CookieOption = SwitchableOption | CookieDeclaration;
type LocaleLabelOption = "strict" | "lowercase";
type ImplicitDefaultLocaleOption = SwitchableOption | { readonly pathMatcher: RegExp | null };
type AutoDetectLocaleOption = SwitchableOption | { readonly pathMatcher: RegExp | null };

// ---------------------------------------------------------------------------
// NextAppPathStrategyConfig
// ---------------------------------------------------------------------------

describe("NextAppPathStrategyConfig", () => {
  type Config = NextAppPathStrategyConfig<SimplePathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "PathAtlas"
      | "localeKey"
      | "autoLocaleBinding"
      | "basePath"
      | "cookie"
      | "localeLabel"
      | "autoDetectLocale"
      | "implicitDefaultLocale"
    >();
  });

  it("PathAtlas is PathAtlasProviderCtor<PAP>", () => {
    expectTypeOf<Config["PathAtlas"]>().toEqualTypeOf<PathAtlasProviderCtor<SimplePathAtlas>>();
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

  it("cookie is CookieOption", () => {
    expectTypeOf<Config["cookie"]>().toEqualTypeOf<CookieOption>();
  });

  it("localeLabel is LocaleLabelOption", () => {
    expectTypeOf<Config["localeLabel"]>().toEqualTypeOf<LocaleLabelOption>();
  });

  it("autoDetectLocale is AutoDetectLocaleOption", () => {
    expectTypeOf<Config["autoDetectLocale"]>().toEqualTypeOf<AutoDetectLocaleOption>();
  });

  it("implicitDefaultLocale is ImplicitDefaultLocaleOption", () => {
    expectTypeOf<Config["implicitDefaultLocale"]>().toEqualTypeOf<ImplicitDefaultLocaleOption>();
  });

  it("rejects invalid union values", () => {
    expectTypeOf<"invalid">().not.toExtend<Config["cookie"]>();
    expectTypeOf<"uppercase">().not.toExtend<Config["localeLabel"]>();
    expectTypeOf<true>().not.toExtend<Config["autoDetectLocale"]>();
  });

  it("all properties are readonly", () => {
    expectTypeOf<Readonly<Config>>().toEqualTypeOf<Config>();
  });
});

// ---------------------------------------------------------------------------
// AnyNextAppPathStrategyConfig
// ---------------------------------------------------------------------------

describe("AnyNextAppPathStrategyConfig", () => {
  it("is assignable from a concrete NextAppPathStrategyConfig", () => {
    expectTypeOf<NextAppPathStrategyConfig<SimplePathAtlas, "locale">>().toExtend<AnyNextAppPathStrategyConfig>();
  });

  it("non-generic properties retain their concrete types", () => {
    expectTypeOf<AnyNextAppPathStrategyConfig["basePath"]>().toBeString();
    expectTypeOf<AnyNextAppPathStrategyConfig["autoLocaleBinding"]>().toEqualTypeOf<SwitchableOption>();
    expectTypeOf<AnyNextAppPathStrategyConfig["cookie"]>().toEqualTypeOf<CookieOption>();
    expectTypeOf<AnyNextAppPathStrategyConfig["localeLabel"]>().toEqualTypeOf<LocaleLabelOption>();
    expectTypeOf<AnyNextAppPathStrategyConfig["autoDetectLocale"]>().toEqualTypeOf<AutoDetectLocaleOption>();
    expectTypeOf<AnyNextAppPathStrategyConfig["implicitDefaultLocale"]>().toEqualTypeOf<ImplicitDefaultLocaleOption>();
  });

  it("generic-dependent properties widen to any", () => {
    expectTypeOf<AnyNextAppPathStrategyConfig["PathAtlas"]>().toEqualTypeOf<PathAtlasProviderCtor<any>>();
    expectTypeOf<AnyNextAppPathStrategyConfig["localeKey"]>().toBeAny();
  });
});

// ---------------------------------------------------------------------------
// PartialNextAppPathStrategyConfig
// ---------------------------------------------------------------------------

describe("PartialNextAppPathStrategyConfig", () => {
  type Config = PartialNextAppPathStrategyConfig<SimplePathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "PathAtlas"
      | "localeKey"
      | "autoLocaleBinding"
      | "basePath"
      | "cookie"
      | "localeLabel"
      | "autoDetectLocale"
      | "implicitDefaultLocale"
    >();
  });

  it("all inherited properties are optional", () => {
    expectTypeOf<{}>().toExtend<Config>();
  });

  it("cookie accepts valid values and rejects invalid ones", () => {
    expectTypeOf<{ cookie: "on" }>().toExtend<Config>();
    expectTypeOf<{ cookie: "off" }>().toExtend<Config>();
    expectTypeOf<{ cookie: { name: "locale"; maxAge: 3600 } }>().toExtend<Config>();
    expectTypeOf<{ cookie: 42 }>().not.toExtend<Config>();
  });

  it("localeLabel accepts valid values and rejects invalid ones", () => {
    expectTypeOf<{ localeLabel: "strict" }>().toExtend<Config>();
    expectTypeOf<{ localeLabel: "lowercase" }>().toExtend<Config>();
    expectTypeOf<{ localeLabel: "uppercase" }>().not.toExtend<Config>();
  });

  it("autoDetectLocale accepts valid values and rejects invalid ones", () => {
    expectTypeOf<{ autoDetectLocale: "on" }>().toExtend<Config>();
    expectTypeOf<{ autoDetectLocale: "off" }>().toExtend<Config>();
    expectTypeOf<{ autoDetectLocale: { pathMatcher: null } }>().toExtend<Config>();
    expectTypeOf<{ autoDetectLocale: true }>().not.toExtend<Config>();
  });

  it("implicitDefaultLocale accepts valid values and rejects invalid ones", () => {
    expectTypeOf<{ implicitDefaultLocale: "off" }>().toExtend<Config>();
    expectTypeOf<{ implicitDefaultLocale: "on" }>().toExtend<Config>();
    expectTypeOf<{ implicitDefaultLocale: { pathMatcher: RegExp } }>().toExtend<Config>();
    expectTypeOf<{ implicitDefaultLocale: "always" }>().not.toExtend<Config>();
  });

  it("all properties are readonly", () => {
    expectTypeOf<Readonly<Config>>().toEqualTypeOf<Config>();
  });
});

// ---------------------------------------------------------------------------
// NextAppPathStrategyCore
// ---------------------------------------------------------------------------

describe("NextAppPathStrategyCore", () => {
  type SimpleConfig = NextAppPathStrategyConfig<SimplePathAtlas, "locale">;

  it("defaultConfig extends the parent defaultConfig with path-specific properties", () => {
    expectTypeOf(NextAppPathStrategyCore.defaultConfig).toHaveProperty("cookie");
    expectTypeOf(NextAppPathStrategyCore.defaultConfig).toHaveProperty("localeLabel");
    expectTypeOf(NextAppPathStrategyCore.defaultConfig).toHaveProperty("autoDetectLocale");
    expectTypeOf(NextAppPathStrategyCore.defaultConfig).toHaveProperty("implicitDefaultLocale");
    expectTypeOf(NextAppPathStrategyCore.defaultConfig).toHaveProperty("PathAtlas");
  });

  it("rMachine is RMachine<RA>", () => {
    expectTypeOf<
      NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, SimpleConfig>["rMachine"]
    >().toEqualTypeOf<RMachine<TestAtlas, TestLocale, AnyFmtProvider>>();
  });

  it("config is C", () => {
    expectTypeOf<
      NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, SimpleConfig>["config"]
    >().toEqualTypeOf<SimpleConfig>();
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("has readonly getPath property", () => {
      type Helper = NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, SimpleConfig>["hrefHelper"];
      expectTypeOf<Helper>().toHaveProperty("getPath");
    });

    it("does not have getUrl property", () => {
      type Helper = NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, SimpleConfig>["hrefHelper"];
      expectTypeOf<Helper>().not.toHaveProperty("getUrl");
    });

    it("getPath is a function", () => {
      type GetPath = NextAppPathStrategyCore<
        TestAtlas,
        TestLocale,
        AnyFmtProvider,
        SimpleConfig
      >["hrefHelper"]["getPath"];
      expectTypeOf<GetPath>().toBeFunction();
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
    type OtherAtlas = { readonly other: { readonly value: number } };
    expectTypeOf<NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, SimpleConfig>>().not.toEqualTypeOf<
      NextAppPathStrategyCore<OtherAtlas, TestLocale, AnyFmtProvider, SimpleConfig>
    >();
  });

  it("different L produce different core types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, SimpleConfig>>().not.toEqualTypeOf<
      NextAppPathStrategyCore<TestAtlas, OtherLocale, AnyFmtProvider, SimpleConfig>
    >();
  });

  it("different config types produce different core types", () => {
    type OtherConfig = NextAppPathStrategyConfig<SimplePathAtlas, "lang">;
    expectTypeOf<NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, SimpleConfig>>().not.toEqualTypeOf<
      NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, OtherConfig>
    >();
  });

  it("different FP produce different core types", () => {
    expectTypeOf<NextAppPathStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, SimpleConfig>>().not.toEqualTypeOf<
      NextAppPathStrategyCore<TestAtlas, TestLocale, EmptyFmtProvider, SimpleConfig>
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppPathStrategyPathTranslator
// ---------------------------------------------------------------------------

describe("NextAppPathStrategyPathTranslator", () => {
  it("is constructible with (AnyPathAtlasProvider, readonly string[], string, boolean, boolean)", () => {
    expectTypeOf(NextAppPathStrategyPathTranslator).toBeConstructibleWith(
      {} as AnyPathAtlasProvider,
      ["en", "it"] as const,
      "en",
      true,
      false
    );
  });

  it("extends HrefTranslator", () => {
    expectTypeOf<NextAppPathStrategyPathTranslator>().toExtend<HrefTranslator>();
  });
});

// ---------------------------------------------------------------------------
// NextAppPathStrategyPathCanonicalizer
// ---------------------------------------------------------------------------

describe("NextAppPathStrategyPathCanonicalizer", () => {
  it("is constructible with (AnyPathAtlasProvider, readonly string[], string, boolean)", () => {
    expectTypeOf(NextAppPathStrategyPathCanonicalizer).toBeConstructibleWith(
      {} as AnyPathAtlasProvider,
      ["en", "it"] as const,
      "en",
      false
    );
  });

  it("extends HrefCanonicalizer", () => {
    expectTypeOf<NextAppPathStrategyPathCanonicalizer>().toExtend<HrefCanonicalizer>();
  });
});
