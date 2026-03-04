import type { RMachine } from "r-machine";
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
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

type TestPathAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo" };
  };
};

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
  type Config = NextAppStrategyConfig<TestPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<"PathAtlas" | "localeKey" | "autoLocaleBinding" | "basePath">();
  });

  it("PathAtlas is PathAtlasCtor<PA>", () => {
    expectTypeOf<Config["PathAtlas"]>().toEqualTypeOf<PathAtlasCtor<TestPathAtlas>>();
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
  it("has PathAtlas, localeKey, autoLocaleBinding, and basePath", () => {
    expectTypeOf<AnyNextAppStrategyConfig>().toHaveProperty("PathAtlas");
    expectTypeOf<AnyNextAppStrategyConfig>().toHaveProperty("localeKey");
    expectTypeOf<AnyNextAppStrategyConfig>().toHaveProperty("autoLocaleBinding");
    expectTypeOf<AnyNextAppStrategyConfig>().toHaveProperty("basePath");
  });

  it("is assignable from a concrete NextAppStrategyConfig", () => {
    expectTypeOf<NextAppStrategyConfig<DefaultPathAtlas, "locale">>().toExtend<AnyNextAppStrategyConfig>();
  });
});

// ---------------------------------------------------------------------------
// PartialNextAppStrategyConfig
// ---------------------------------------------------------------------------

describe("PartialNextAppStrategyConfig", () => {
  type Config = PartialNextAppStrategyConfig<TestPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Config;
    expectTypeOf<Keys>().toEqualTypeOf<"PathAtlas" | "localeKey" | "autoLocaleBinding" | "basePath">();
  });

  it("all properties are optional", () => {
    expectTypeOf<{}>().toExtend<Config>();
  });

  it("PathAtlas accepts PathAtlasCtor<PA>", () => {
    expectTypeOf<PathAtlasCtor<TestPathAtlas>>().toExtend<NonNullable<Config["PathAtlas"]>>();
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
  type Core = NextAppStrategyCore<TestAtlas, TestConfig>;

  it("defaultConfig is NextAppStrategyConfig<DefaultPathAtlas, 'locale'>", () => {
    expectTypeOf(NextAppStrategyCore.defaultConfig).toEqualTypeOf<NextAppStrategyConfig<DefaultPathAtlas, "locale">>();
  });

  it("rMachine is RMachine<RA>", () => {
    expectTypeOf<Core["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas>>();
  });

  it("config is C", () => {
    expectTypeOf<Core["config"]>().toEqualTypeOf<TestConfig>();
  });

  it("createClientToolset returns Promise<NextAppClientToolset<RA, InstanceType<C['PathAtlas']>>>", () => {
    expectTypeOf<Core["createClientToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppClientToolset<TestAtlas, DefaultPathAtlas>>
    >();
  });

  it("createClientToolset return type reflects a custom PathAtlas", () => {
    type CustomConfig = NextAppStrategyConfig<TestPathAtlas, "locale">;
    type CustomCore = NextAppStrategyCore<TestAtlas, CustomConfig>;

    expectTypeOf<CustomCore["createClientToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppClientToolset<TestAtlas, TestPathAtlas>>
    >();
  });

  it("createServerToolset accepts NextAppClientRMachine", () => {
    expectTypeOf<Core["createServerToolset"]>().parameter(0).toEqualTypeOf<NextAppClientRMachine>();
  });

  it("createServerToolset returns Promise<NextAppServerToolset<RA, PA, LK>>", () => {
    expectTypeOf<Core["createServerToolset"]>().returns.toEqualTypeOf<
      Promise<NextAppServerToolset<TestAtlas, DefaultPathAtlas, "locale">>
    >();
  });

  it("different atlas types produce different core types", () => {
    type OtherAtlas = { readonly other: { readonly value: number } };
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<OtherAtlas, TestConfig>
    >();
  });

  it("different config types produce different core types", () => {
    type OtherConfig = NextAppStrategyConfig<DefaultPathAtlas, "lang">;
    expectTypeOf<NextAppStrategyCore<TestAtlas, TestConfig>>().not.toEqualTypeOf<
      NextAppStrategyCore<TestAtlas, OtherConfig>
    >();
  });
});
