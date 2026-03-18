import type { RMachine } from "r-machine";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasCtor } from "#r-machine/next/core";
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
      type Ctor = new (rMachine: RMachine<TestAtlas, TestLocale>) => any;
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<Ctor>();
    });

    it("2-arg overload: accepts rMachine and partial config", () => {
      type Ctor = new (
        rMachine: RMachine<TestAtlas, TestLocale>,
        config: PartialNextAppFlatStrategyConfig<DefaultPA, DefaultLK>
      ) => any;
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<Ctor>();
    });
  });

  // -----------------------------------------------------------------------
  // Default type parameters
  // -----------------------------------------------------------------------

  describe("default type parameters", () => {
    it("PA defaults to defaultConfig PathAtlas instance", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>>().toExtend<
        NextAppFlatStrategyCore<TestAtlas, TestLocale, DefaultConfig>
      >();
    });

    it("LK defaults to defaultConfig localeKey", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>["config"]["localeKey"]>().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // Public properties
  // -----------------------------------------------------------------------

  describe("public properties", () => {
    it("rMachine is RMachine<RA, L>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, TestLocale>
      >();
    });

    it("config.cookie is CookieDeclaration", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>["config"]["cookie"]>().toEqualTypeOf<CookieDeclaration>();
    });

    it("config.pathMatcher is RegExp | null", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale>["config"]["pathMatcher"]
      >().toEqualTypeOf<RegExp | null>();
    });
  });

  // -----------------------------------------------------------------------
  // Toolset return types
  // -----------------------------------------------------------------------

  describe("toolset return types", () => {
    it("createClientToolset returns Promise<NextAppClientToolset<RA, L, DefaultPA>>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>["createClientToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, DefaultPA>>
      >();
    });

    it("createServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>["createServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createServerToolset returns Promise<NextAppServerToolset<RA, L, DefaultPA, DefaultLK>>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>["createServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, DefaultPA, DefaultLK>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PA is wired through to config.PathAtlas", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>["config"]["PathAtlas"]
      >().toEqualTypeOf<PathAtlasCtor<TranslatedPathAtlas>>();
    });

    it("custom LK is reflected in config.localeKey", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, SimplePathAtlas, "lang">["config"]["localeKey"]
      >().toEqualTypeOf<"lang">();
    });

    it("custom PA affects client toolset return type", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>["createClientToolset"]
      >().returns.toEqualTypeOf<Promise<NextAppClientToolset<TestAtlas, TestLocale, TranslatedPathAtlas>>>();
    });

    it("custom LK affects server toolset return type", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, SimplePathAtlas, "lang">["createServerToolset"]
      >().returns.toEqualTypeOf<Promise<NextAppServerToolset<TestAtlas, TestLocale, SimplePathAtlas, "lang">>>();
    });

    it("different RA produce different types", () => {
      type OtherAtlas = { readonly other: { readonly value: number } };
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>>().not.toEqualTypeOf<
        NextAppFlatStrategy<OtherAtlas, TestLocale>
      >();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale>>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, OtherLocale>
      >();
    });

    it("different PA produce different types", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, SimplePathAtlas>>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, SimplePathAtlas, "locale">>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, SimplePathAtlas, "lang">
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

    it("rejects non-AnyPathAtlas as PA", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, string>;
    });

    it("rejects non-string as LK", () => {
      // @ts-expect-error - number does not satisfy string constraint
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, SimplePathAtlas, number>;
    });

    it("rejects non-AnyLocale as L", () => {
      // @ts-expect-error - number does not satisfy AnyLocale (string)
      type _Invalid = NextAppFlatStrategy<TestAtlas, number>;
    });
  });
});
