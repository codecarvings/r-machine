import type { AnyLocale, AnyResourceAtlas, RMachine } from "r-machine";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import { createReactStandardImpl } from "../../src/core/react-standard.impl.js";
import type { ReactStandardStrategyConfig } from "../../src/core/react-standard-strategy-core.js";
import type { ReactImpl } from "../../src/core/react-toolset.js";

// ---------------------------------------------------------------------------
// createReactStandardImpl — function signature
// ---------------------------------------------------------------------------

describe("createReactStandardImpl", () => {
  describe("function signature", () => {
    it("is a function", () => {
      expectTypeOf(createReactStandardImpl).toBeFunction();
    });

    it("first parameter accepts RMachine<AnyResourceAtlas, AnyLocale>", () => {
      expectTypeOf(createReactStandardImpl<AnyResourceAtlas, AnyLocale>)
        .parameter(0)
        .toEqualTypeOf<RMachine<AnyResourceAtlas, AnyLocale>>();
    });

    it("second parameter is ReactStandardStrategyConfig", () => {
      expectTypeOf(createReactStandardImpl<AnyResourceAtlas, AnyLocale>)
        .parameter(1)
        .toEqualTypeOf<ReactStandardStrategyConfig>();
    });

    it("takes exactly two parameters", () => {
      expectTypeOf(createReactStandardImpl<AnyResourceAtlas, AnyLocale>).parameters.toEqualTypeOf<
        [rMachine: RMachine<AnyResourceAtlas, AnyLocale>, strategyConfig: ReactStandardStrategyConfig]
      >();
    });

    it("returns Promise<ReactImpl<L>>", () => {
      expectTypeOf(createReactStandardImpl<AnyResourceAtlas, AnyLocale>).returns.toEqualTypeOf<
        Promise<ReactImpl<AnyLocale>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // parameter assignability
  // -----------------------------------------------------------------------

  describe("parameter assignability", () => {
    it("accepts a narrowly-typed RMachine", () => {
      type NarrowAtlas = { readonly common: { readonly greeting: string } };
      expectTypeOf<RMachine<NarrowAtlas, AnyLocale>>().toExtend<RMachine<AnyResourceAtlas, AnyLocale>>();
    });

    it("accepts a config with both fields undefined", () => {
      expectTypeOf<{
        readonly localeDetector: undefined;
        readonly localeStore: undefined;
      }>().toExtend<ReactStandardStrategyConfig>();
    });

    it("accepts a config with a sync localeDetector", () => {
      expectTypeOf<{
        readonly localeDetector: () => string;
        readonly localeStore: undefined;
      }>().toExtend<ReactStandardStrategyConfig>();
    });

    it("accepts a config with an async localeDetector", () => {
      expectTypeOf<{
        readonly localeDetector: () => Promise<string>;
        readonly localeStore: undefined;
      }>().toExtend<ReactStandardStrategyConfig>();
    });

    it("accepts a config with a CustomLocaleStore", () => {
      expectTypeOf<{
        readonly localeDetector: undefined;
        readonly localeStore: CustomLocaleStore;
      }>().toExtend<ReactStandardStrategyConfig>();
    });

    it("accepts a config with both localeDetector and localeStore", () => {
      expectTypeOf<{
        readonly localeDetector: CustomLocaleDetector;
        readonly localeStore: CustomLocaleStore;
      }>().toExtend<ReactStandardStrategyConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // resolved value shape
  // -----------------------------------------------------------------------

  describe("resolved value", () => {
    it("resolves to ReactImpl<AnyLocale>", () => {
      type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AnyResourceAtlas, AnyLocale>>>;
      expectTypeOf<Resolved>().toEqualTypeOf<ReactImpl<AnyLocale>>();
    });

    it("resolved value has readLocale", () => {
      type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AnyResourceAtlas, AnyLocale>>>;
      expectTypeOf<Resolved>().toHaveProperty("readLocale");
    });

    it("resolved value has writeLocale", () => {
      type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AnyResourceAtlas, AnyLocale>>>;
      expectTypeOf<Resolved>().toHaveProperty("writeLocale");
    });

    it("readLocale returns string | Promise<string>", () => {
      type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AnyResourceAtlas, AnyLocale>>>;
      expectTypeOf<Resolved["readLocale"]>().returns.toEqualTypeOf<string | Promise<string>>();
    });

    it("readLocale takes no parameters", () => {
      type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AnyResourceAtlas, AnyLocale>>>;
      expectTypeOf<Resolved["readLocale"]>().parameters.toEqualTypeOf<[]>();
    });

    it("writeLocale takes a string parameter", () => {
      type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AnyResourceAtlas, AnyLocale>>>;
      expectTypeOf<Resolved["writeLocale"]>().parameter(0).toEqualTypeOf<string>();
    });

    it("writeLocale returns void | Promise<void>", () => {
      type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AnyResourceAtlas, AnyLocale>>>;
      expectTypeOf<Resolved["writeLocale"]>().returns.toEqualTypeOf<void | Promise<void>>();
    });

    it("resolved value has exactly two keys", () => {
      type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AnyResourceAtlas, AnyLocale>>>;
      type Keys = keyof Resolved;
      expectTypeOf<Keys>().toEqualTypeOf<"readLocale" | "writeLocale">();
    });
  });
});

// ---------------------------------------------------------------------------
// Narrowed Locale type
// ---------------------------------------------------------------------------

describe("narrowed Locale type", () => {
  type AppLocale = "en" | "it";
  type AppAtlas = { readonly common: { readonly greeting: string } };

  it("returns ReactImpl with narrowed locale", () => {
    type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AppAtlas, AppLocale>>>;
    expectTypeOf<Resolved>().toEqualTypeOf<ReactImpl<AppLocale>>();
  });

  it("readLocale returns narrowed locale type", () => {
    type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AppAtlas, AppLocale>>>;
    expectTypeOf<Resolved["readLocale"]>().returns.toEqualTypeOf<AppLocale | Promise<AppLocale>>();
  });

  it("writeLocale accepts narrowed locale type", () => {
    type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AppAtlas, AppLocale>>>;
    expectTypeOf<Resolved["writeLocale"]>().parameter(0).toEqualTypeOf<AppLocale>();
  });
});
