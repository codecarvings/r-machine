import type { AnyFmtProvider, EmptyFmtProvider, RMachine } from "r-machine";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasProviderCtor } from "#r-machine/next/core";
import type {
  NextAppClientRMachine,
  NextAppClientToolset,
  NextAppFlatStrategyConfig,
  NextAppServerToolset,
  PartialNextAppFlatStrategyConfig,
} from "#r-machine/next/core/app";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppFlatStrategyCore } from "#r-machine/next/core/app";
import type { NextAppFlatStrategy } from "../../src/app/next-app-flat-strategy.js";
import type { SimplePathAtlas, TestLocale, TranslatedPathAtlas } from "../_fixtures/constants.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

// Derive default type parameters from public API — no internal imports
type DefaultPA = InstanceType<(typeof NextAppFlatStrategyCore)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppFlatStrategyCore)["defaultConfig"]["localeKey"];
type DefaultConfig = NextAppFlatStrategyConfig<DefaultPA, DefaultLK>;

// ---------------------------------------------------------------------------
// NextAppFlatStrategy
// ---------------------------------------------------------------------------

describe("NextAppFlatStrategy", () => {
  // -----------------------------------------------------------------------
  // Constructability & overloads
  // -----------------------------------------------------------------------

  describe("constructability", () => {
    it("is not abstract (can be instantiated)", () => {
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<new (...args: any[]) => any>();
    });

    it("1-arg overload: accepts rMachine only", () => {
      type Ctor = new (rMachine: RMachine<TestAtlas, TestLocale, AnyFmtProvider>) => any;
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<Ctor>();
    });

    it("2-arg overload: accepts rMachine and partial config", () => {
      type Ctor = new (
        rMachine: RMachine<TestAtlas, TestLocale, AnyFmtProvider>,
        config: PartialNextAppFlatStrategyConfig<DefaultPA, DefaultLK>
      ) => any;
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<Ctor>();
    });
  });

  // -----------------------------------------------------------------------
  // Default type parameters
  // -----------------------------------------------------------------------

  describe("default type parameters", () => {
    it("PAP defaults to defaultConfig PathAtlas instance", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>>().toExtend<
        NextAppFlatStrategyCore<TestAtlas, TestLocale, AnyFmtProvider, DefaultConfig>
      >();
    });

    it("LK defaults to defaultConfig localeKey", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>["config"]["localeKey"]
      >().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // Public properties
  // -----------------------------------------------------------------------

  describe("public properties", () => {
    it("rMachine is RMachine<RA, L>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, TestLocale, AnyFmtProvider>
      >();
    });

    it("config.cookie is CookieDeclaration", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>["config"]["cookie"]
      >().toEqualTypeOf<CookieDeclaration>();
    });

    it("config.pathMatcher is RegExp | null", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>["config"]["pathMatcher"]
      >().toEqualTypeOf<RegExp | null>();
    });
  });

  // -----------------------------------------------------------------------
  // Toolset return types
  // -----------------------------------------------------------------------

  describe("toolset return types", () => {
    it("createClientToolset returns Promise<NextAppClientToolset<RA, L, DefaultPA>>", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>["createClientToolset"]
      >().returns.toEqualTypeOf<Promise<NextAppClientToolset<TestAtlas, TestLocale, AnyFmtProvider, DefaultPA>>>();
    });

    it("createServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>["createServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createServerToolset returns Promise<NextAppServerToolset<RA, L, DefaultPA, DefaultLK>>", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>["createServerToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, DefaultPA, DefaultLK>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PAP is wired through to config.PathAtlas", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas>["config"]["PathAtlas"]
      >().toEqualTypeOf<PathAtlasProviderCtor<TranslatedPathAtlas>>();
    });

    it("custom LK is reflected in config.localeKey", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, SimplePathAtlas, "lang">["config"]["localeKey"]
      >().toEqualTypeOf<"lang">();
    });

    it("custom PAP affects client toolset return type", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas>["createClientToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas>>
      >();
    });

    it("custom LK affects server toolset return type", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, SimplePathAtlas, "lang">["createServerToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, SimplePathAtlas, "lang">>
      >();
    });

    it("different RA produce different types", () => {
      type OtherAtlas = { readonly other: { readonly value: number } };
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>>().not.toEqualTypeOf<
        NextAppFlatStrategy<OtherAtlas, TestLocale, AnyFmtProvider>
      >();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, OtherLocale, AnyFmtProvider>
      >();
    });

    it("different PAP produce different types", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, SimplePathAtlas>>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, SimplePathAtlas, "locale">
      >().not.toEqualTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, SimplePathAtlas, "lang">>();
    });

    it("different FP produce different types", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider>>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, EmptyFmtProvider>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Type constraint violations
  // -----------------------------------------------------------------------

  describe("type constraint violations", () => {
    it("rejects non-AnyResourceAtlas as RA", () => {
      // @ts-expect-error - string does not satisfy AnyResourceAtlas
      type _Invalid = NextAppFlatStrategy<string, TestLocale>;
    });

    it("rejects non-AnyPathAtlasProvider as PAP", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlasProvider
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, string>;
    });

    it("rejects non-string as LK", () => {
      // @ts-expect-error - number does not satisfy string constraint
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, AnyFmtProvider, SimplePathAtlas, number>;
    });

    it("rejects non-AnyLocale as L", () => {
      // @ts-expect-error - number does not satisfy AnyLocale (string)
      type _Invalid = NextAppFlatStrategy<TestAtlas, number>;
    });

    it("rejects non-AnyFmtProvider as FP", () => {
      // @ts-expect-error - string does not satisfy AnyFmtProvider
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, string>;
    });
  });
});
