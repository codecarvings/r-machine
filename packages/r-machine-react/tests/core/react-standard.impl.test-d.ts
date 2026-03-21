import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
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

    it("first parameter accepts RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider>", () => {
      expectTypeOf(createReactStandardImpl<AnyResourceAtlas, AnyLocale, AnyFmtProvider>)
        .parameter(0)
        .toEqualTypeOf<RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider>>();
    });

    it("second parameter is ReactStandardStrategyConfig", () => {
      expectTypeOf(createReactStandardImpl<AnyResourceAtlas, AnyLocale, AnyFmtProvider>)
        .parameter(1)
        .toEqualTypeOf<ReactStandardStrategyConfig>();
    });

    it("takes exactly two parameters", () => {
      expectTypeOf(createReactStandardImpl<AnyResourceAtlas, AnyLocale, AnyFmtProvider>).parameters.toEqualTypeOf<
        [rMachine: RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider>, strategyConfig: ReactStandardStrategyConfig]
      >();
    });

    it("returns Promise<ReactImpl<L>>", () => {
      expectTypeOf(createReactStandardImpl<AnyResourceAtlas, AnyLocale, AnyFmtProvider>).returns.toEqualTypeOf<
        Promise<ReactImpl<AnyLocale>>
      >();
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
    type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AppAtlas, AppLocale, AnyFmtProvider>>>;
    expectTypeOf<Resolved>().toEqualTypeOf<ReactImpl<AppLocale>>();
  });

  it("readLocale returns narrowed locale type", () => {
    type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AppAtlas, AppLocale, AnyFmtProvider>>>;
    expectTypeOf<Resolved["readLocale"]>().returns.toEqualTypeOf<AppLocale | Promise<AppLocale>>();
  });

  it("writeLocale accepts narrowed locale type", () => {
    type Resolved = Awaited<ReturnType<typeof createReactStandardImpl<AppAtlas, AppLocale, AnyFmtProvider>>>;
    expectTypeOf<Resolved["writeLocale"]>().parameter(0).toEqualTypeOf<AppLocale>();
  });
});
