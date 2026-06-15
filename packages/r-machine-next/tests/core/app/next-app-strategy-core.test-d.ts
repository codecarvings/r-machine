import type { AnyResAtlas, ExperimentalFlags, ResEquipment, SwitchableOption } from "r-machine/core";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, PathAtlasClass } from "#r-machine/next/core";
import type { NextAppClientRMachine, NextAppClientToolset } from "../../../src/core/app/next-app-client-toolset.js";
import type { NextAppServerToolset } from "../../../src/core/app/next-app-server-toolset.js";
import type {
  AnyNextAppStrategyConfig,
  NextAppStrategyConfig,
  NextAppStrategyConfigParams,
} from "../../../src/core/app/next-app-strategy-core.js";
import {
  DefaultPathAtlas,
  localeHeaderName,
  NextAppStrategyCore,
} from "../../../src/core/app/next-app-strategy-core.js";
import type { TestLocale, TranslatedPathAtlas } from "../../_fixtures/constants.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;

// ---------------------------------------------------------------------------
// localeHeaderName
// ---------------------------------------------------------------------------

describe("localeHeaderName", () => {
  it("is a string", () => {
    expectTypeOf(localeHeaderName).toBeString();
  });
});

// ---------------------------------------------------------------------------
// DefaultPathAtlas
// ---------------------------------------------------------------------------

describe("DefaultPathAtlas", () => {
  it("has a readonly segment property", () => {
    expectTypeOf<DefaultPathAtlas>().toHaveProperty("segment");
  });

  it("satisfies AnyPathAtlas", () => {
    expectTypeOf<DefaultPathAtlas>().toExtend<AnyPathAtlas>();
  });

  it("is constructable with no arguments", () => {
    expectTypeOf(DefaultPathAtlas).constructorParameters.toEqualTypeOf<[]>();
  });
});

// ---------------------------------------------------------------------------
// NextAppStrategyConfig
// ---------------------------------------------------------------------------

describe("NextAppStrategyConfig", () => {
  type CKM = typeof NextAppStrategyCore.defaultConfig.clientKit;
  type SKM = typeof NextAppStrategyCore.defaultConfig.serverKit;
  type Config = NextAppStrategyConfig<TestAtlas, CKM, SKM, TranslatedPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<
      "clientKit" | "serverKit" | "PathAtlas" | "localeKey" | "autoLocaleBinding" | "basePath" | "reactCompiler"
    >();
  });

  it("PathAtlas is PathAtlasClass<TranslatedPathAtlas>", () => {
    expectTypeOf<Config["PathAtlas"]>().toEqualTypeOf<PathAtlasClass<TranslatedPathAtlas>>();
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

  it("reactCompiler is SwitchableOption", () => {
    expectTypeOf<Config["reactCompiler"]>().toEqualTypeOf<SwitchableOption>();
  });

  it("all properties are readonly", () => {
    expectTypeOf<Readonly<Config>>().toEqualTypeOf<Config>();
  });
});

// ---------------------------------------------------------------------------
// AnyNextAppStrategyConfig
// ---------------------------------------------------------------------------

describe("AnyNextAppStrategyConfig", () => {
  it("has exactly the expected properties", () => {
    type Keys = keyof AnyNextAppStrategyConfig;
    expectTypeOf<Keys>().toEqualTypeOf<
      "clientKit" | "serverKit" | "PathAtlas" | "localeKey" | "autoLocaleBinding" | "basePath" | "reactCompiler"
    >();
  });

  it("is assignable from a concrete NextAppStrategyConfig", () => {
    type CKM = typeof NextAppStrategyCore.defaultConfig.clientKit;
    type SKM = typeof NextAppStrategyCore.defaultConfig.serverKit;
    expectTypeOf<
      NextAppStrategyConfig<TestAtlas, CKM, SKM, DefaultPathAtlas, "locale">
    >().toExtend<AnyNextAppStrategyConfig>();
  });
});

// ---------------------------------------------------------------------------
// NextAppStrategyConfigParams
// ---------------------------------------------------------------------------

describe("NextAppStrategyConfigParams", () => {
  type CKM = typeof NextAppStrategyCore.defaultConfig.clientKit;
  type SKM = typeof NextAppStrategyCore.defaultConfig.serverKit;
  type Config = NextAppStrategyConfigParams<TestAtlas, CKM, SKM, TranslatedPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<
      "clientKit" | "serverKit" | "PathAtlas" | "localeKey" | "autoLocaleBinding" | "basePath" | "reactCompiler"
    >();
  });

  it("all properties are optional", () => {
    expectTypeOf<{}>().toExtend<Config>();
  });

  it("PathAtlas accepts PathAtlasClass<PA>", () => {
    expectTypeOf<PathAtlasClass<TranslatedPathAtlas>>().toExtend<NonNullable<Config["PathAtlas"]>>();
  });

  it("localeKey accepts the literal string type", () => {
    expectTypeOf<"locale">().toExtend<NonNullable<Config["localeKey"]>>();
  });

  it("autoLocaleBinding accepts SwitchableOption", () => {
    expectTypeOf<SwitchableOption>().toExtend<NonNullable<Config["autoLocaleBinding"]>>();
  });

  it("basePath accepts string", () => {
    expectTypeOf<string>().toExtend<NonNullable<Config["basePath"]>>();
  });

  it("all properties are readonly", () => {
    expectTypeOf<Readonly<Config>>().toEqualTypeOf<Config>();
  });
});

// ---------------------------------------------------------------------------
// NextAppStrategyCore
// ---------------------------------------------------------------------------

describe("NextAppStrategyCore", () => {
  type CKM = typeof NextAppStrategyCore.defaultConfig.clientKit;
  type SKM = typeof NextAppStrategyCore.defaultConfig.serverKit;
  type TestConfig = NextAppStrategyConfig<TestAtlas, CKM, SKM, DefaultPathAtlas, "locale">;
  type Core = NextAppStrategyCore<TestAtlas, TestLocale, E, EF, TestConfig>;

  it("defaultConfig has expected shape", () => {
    expectTypeOf(NextAppStrategyCore.defaultConfig).toHaveProperty("clientKit");
    expectTypeOf(NextAppStrategyCore.defaultConfig).toHaveProperty("serverKit");
    expectTypeOf(NextAppStrategyCore.defaultConfig).toHaveProperty("PathAtlas");
    expectTypeOf(NextAppStrategyCore.defaultConfig).toHaveProperty("localeKey");
    expectTypeOf(NextAppStrategyCore.defaultConfig).toHaveProperty("autoLocaleBinding");
    expectTypeOf(NextAppStrategyCore.defaultConfig).toHaveProperty("basePath");
  });

  it("createClientToolset returns Promise<NextAppClientToolset<RA, L, EF, clientKit, PA>>", () => {
    expectTypeOf<Core["createClientToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppClientToolset<TestAtlas, TestLocale, EF, CKM, DefaultPathAtlas>>
    >();
  });

  it("createClientToolset return type reflects a custom PathAtlas", () => {
    type CustConfig = NextAppStrategyConfig<TestAtlas, CKM, SKM, TranslatedPathAtlas, "locale">;
    type CustCore = NextAppStrategyCore<TestAtlas, TestLocale, E, EF, CustConfig>;

    expectTypeOf<CustCore["createClientToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppClientToolset<TestAtlas, TestLocale, EF, CKM, TranslatedPathAtlas>>
    >();
  });

  it("createServerToolset accepts NextAppClientRMachine<L>", () => {
    expectTypeOf<Core["createServerToolset"]>().parameter(0).toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
  });

  it("createServerToolset returns Promise<NextAppServerToolset<RA, L, serverKit, PA, LK>>", () => {
    expectTypeOf<Core["createServerToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppServerToolset<TestAtlas, TestLocale, SKM, DefaultPathAtlas, "locale">>
    >();
  });

  it("different RA produce different core types", () => {
    interface OtherAtlas extends AnyResAtlas {
      readonly other: { readonly value: number };
    }
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestLocale, E, EF, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<OtherAtlas, TestLocale, ResEquipment<OtherAtlas>, EF, TestConfig>
    >();
  });

  it("different L produce different core types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestLocale, E, EF, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<TestAtlas, OtherLocale, E, EF, TestConfig>
    >();
  });

  it("different config types produce different core types", () => {
    type OtherConfig = NextAppStrategyConfig<TestAtlas, CKM, SKM, DefaultPathAtlas, "lang">;
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestLocale, E, EF, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<TestAtlas, TestLocale, E, EF, OtherConfig>
    >();
  });

  // -----------------------------------------------------------------------
  // Locale type propagation end-to-end
  // -----------------------------------------------------------------------

  it("L propagates from strategy to createServerToolset's NextAppClientRMachine parameter", () => {
    type CoreEnIt = NextAppStrategyCore<TestAtlas, "en" | "it", E, EF, TestConfig>;
    type CoreFrDe = NextAppStrategyCore<TestAtlas, "fr" | "de", E, EF, TestConfig>;
    expectTypeOf<CoreEnIt["createServerToolset"]>().parameter(0).toEqualTypeOf<NextAppClientRMachine<"en" | "it">>();
    expectTypeOf<CoreFrDe["createServerToolset"]>().parameter(0).toEqualTypeOf<NextAppClientRMachine<"fr" | "de">>();
  });
});
