import type { AnyFmtProvider, EmptyFmtProvider, RMachine } from "r-machine";
import type { SwitchableOption } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, PathAtlasCtor } from "#r-machine/next/core";
import type { NextAppClientRMachine, NextAppClientToolset } from "../../../src/core/app/next-app-client-toolset.js";
import type { NextAppServerToolset } from "../../../src/core/app/next-app-server-toolset.js";
import type {
  AnyNextAppStrategyConfig,
  NextAppStrategyConfig,
  PartialNextAppStrategyConfig,
} from "../../../src/core/app/next-app-strategy-core.js";
import {
  DefaultPathAtlas,
  localeHeaderName,
  NextAppStrategyCore,
} from "../../../src/core/app/next-app-strategy-core.js";
import type { TestLocale, TranslatedPathAtlas } from "../../_fixtures/constants.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

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
  it("has a readonly decl property", () => {
    expectTypeOf<DefaultPathAtlas>().toHaveProperty("decl");
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
  type Config = NextAppStrategyConfig<TranslatedPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<"PathAtlas" | "localeKey" | "autoLocaleBinding" | "basePath">();
  });

  it("PathAtlas is PathAtlasCtor<PA>", () => {
    expectTypeOf<Config["PathAtlas"]>().toEqualTypeOf<PathAtlasCtor<TranslatedPathAtlas>>();
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
    expectTypeOf<Keys>().toEqualTypeOf<"PathAtlas" | "localeKey" | "autoLocaleBinding" | "basePath">();
  });

  it("is assignable from a concrete NextAppStrategyConfig", () => {
    expectTypeOf<NextAppStrategyConfig<DefaultPathAtlas, "locale">>().toExtend<AnyNextAppStrategyConfig>();
  });
});

// ---------------------------------------------------------------------------
// PartialNextAppStrategyConfig
// ---------------------------------------------------------------------------

describe("PartialNextAppStrategyConfig", () => {
  type Config = PartialNextAppStrategyConfig<TranslatedPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<"PathAtlas" | "localeKey" | "autoLocaleBinding" | "basePath">();
  });

  it("all properties are optional", () => {
    expectTypeOf<{}>().toExtend<Config>();
  });

  it("PathAtlas accepts PathAtlasCtor<PA>", () => {
    expectTypeOf<PathAtlasCtor<TranslatedPathAtlas>>().toExtend<NonNullable<Config["PathAtlas"]>>();
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
  type TestConfig = NextAppStrategyConfig<DefaultPathAtlas, "locale">;
  type Core = NextAppStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, TestConfig>;

  it("defaultConfig is NextAppStrategyConfig<DefaultPathAtlas, 'locale'>", () => {
    expectTypeOf(NextAppStrategyCore.defaultConfig).toEqualTypeOf<NextAppStrategyConfig<DefaultPathAtlas, "locale">>();
  });

  it("rMachine is RMachine<RA, L>", () => {
    expectTypeOf<Core["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, TestLocale, AnyFmtProvider>>();
  });

  it("config is C", () => {
    expectTypeOf<Core["config"]>().toEqualTypeOf<TestConfig>();
  });

  it("createClientToolset returns Promise<NextAppClientToolset<RA, L, InstanceType<C['PathAtlas']>>>", () => {
    expectTypeOf<Core["createClientToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppClientToolset<TestAtlas, TestLocale, AnyFmtProvider, DefaultPathAtlas>>
    >();
  });

  it("createClientToolset return type reflects a custom PathAtlas", () => {
    type CustomConfig = NextAppStrategyConfig<TranslatedPathAtlas, "locale">;
    type CustomCore = NextAppStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, CustomConfig>;

    expectTypeOf<CustomCore["createClientToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppClientToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas>>
    >();
  });

  it("createServerToolset accepts NextAppClientRMachine<L>", () => {
    expectTypeOf<Core["createServerToolset"]>().parameter(0).toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
  });

  it("createServerToolset returns Promise<NextAppServerToolset<RA, L, PA, LK>>", () => {
    expectTypeOf<Core["createServerToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, DefaultPathAtlas, "locale">>
    >();
  });

  it("different RA produce different core types", () => {
    type OtherAtlas = { readonly other: { readonly value: number } };
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<OtherAtlas, TestLocale, AnyFmtProvider, TestConfig>
    >();
  });

  it("different L produce different core types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<TestAtlas, OtherLocale, AnyFmtProvider, TestConfig>
    >();
  });

  it("different config types produce different core types", () => {
    type OtherConfig = NextAppStrategyConfig<DefaultPathAtlas, "lang">;
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, OtherConfig>
    >();
  });

  it("different FP produce different core types", () => {
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<TestAtlas, TestLocale, EmptyFmtProvider, TestConfig>
    >();
  });

  // -----------------------------------------------------------------------
  // Locale type propagation end-to-end
  // -----------------------------------------------------------------------

  it("L propagates from strategy to client toolset's useLocale", () => {
    type CoreEnIt = NextAppStrategyCore<TestAtlas, "en" | "it", AnyFmtProvider, TestConfig>;
    type CoreFrDe = NextAppStrategyCore<TestAtlas, "fr" | "de", AnyFmtProvider, TestConfig>;
    type ClientEnIt = Awaited<ReturnType<CoreEnIt["createClientToolset"]>>;
    type ClientFrDe = Awaited<ReturnType<CoreFrDe["createClientToolset"]>>;
    expectTypeOf<ReturnType<ClientEnIt["useLocale"]>>().toEqualTypeOf<"en" | "it">();
    expectTypeOf<ReturnType<ClientFrDe["useLocale"]>>().toEqualTypeOf<"fr" | "de">();
  });

  it("L propagates from strategy to server toolset's getLocale and setLocale", () => {
    type ServerEnIt = Awaited<
      ReturnType<NextAppStrategyCore<TestAtlas, "en" | "it", AnyFmtProvider, TestConfig>["createServerToolset"]>
    >;
    expectTypeOf<ReturnType<ServerEnIt["getLocale"]>>().toEqualTypeOf<Promise<"en" | "it">>();
    expectTypeOf<ServerEnIt["setLocale"]>().toEqualTypeOf<(newLocale: "en" | "it") => Promise<void>>();
  });

  it("L propagates from strategy to createServerToolset's NextAppClientRMachine parameter", () => {
    type CoreEnIt = NextAppStrategyCore<TestAtlas, "en" | "it", AnyFmtProvider, TestConfig>;
    type CoreFrDe = NextAppStrategyCore<TestAtlas, "fr" | "de", AnyFmtProvider, TestConfig>;
    expectTypeOf<CoreEnIt["createServerToolset"]>().parameter(0).toEqualTypeOf<NextAppClientRMachine<"en" | "it">>();
    expectTypeOf<CoreFrDe["createServerToolset"]>().parameter(0).toEqualTypeOf<NextAppClientRMachine<"fr" | "de">>();
  });
});
