import type { NamespaceMap, RMachine } from "r-machine";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasCtor } from "#r-machine/next/core";
import type { NextAppClientRMachine, NextAppClientToolset, NextAppServerToolset } from "#r-machine/next/core/app";
import type { NextAppFlatStrategyConfig, PartialNextAppFlatStrategyConfig } from "#r-machine/next/core/app/flat";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppFlatStrategyCore } from "#r-machine/next/core/app/flat";
import type { NextAppFlatStrategy } from "../../src/app/flat/next-app-flat-strategy.js";
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
      type Ctor = new (rMachine: RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>) => any;
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<Ctor>();
    });

    it("2-arg overload: accepts rMachine and partial config", () => {
      type Ctor = new (
        rMachine: RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>,
        config: PartialNextAppFlatStrategyConfig<DefaultPA, DefaultLK>
      ) => any;
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<Ctor>();
    });
  });

  // -----------------------------------------------------------------------
  // Default type parameters
  // -----------------------------------------------------------------------

  describe("default type parameters", () => {
    it("PAD defaults to defaultConfig PathAtlas instance", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().toExtend<
        NextAppFlatStrategyCore<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, DefaultConfig>
      >();
    });

    it("LK defaults to defaultConfig localeKey", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["localeKey"]
      >().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // Public properties
  // -----------------------------------------------------------------------

  describe("public properties", () => {
    it("rMachine is RMachine<RA, L>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>
      >();
    });

    it("config.cookie is CookieDeclaration", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["cookie"]
      >().toEqualTypeOf<CookieDeclaration>();
    });

    it("config.pathMatcher is RegExp | null", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["pathMatcher"]
      >().toEqualTypeOf<RegExp | null>();
    });
  });

  // -----------------------------------------------------------------------
  // Toolset return types
  // -----------------------------------------------------------------------

  describe("toolset return types", () => {
    it("createClientToolset returns Promise<NextAppClientToolset<RA, L, DefaultPA>>", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createClientToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, DefaultPA>>
      >();
    });

    it("createServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createServerToolset returns Promise<NextAppServerToolset<RA, L, DefaultPA, DefaultLK>>", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createServerToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, DefaultPA, DefaultLK>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PAD is wired through to config.PathAtlas", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["config"]["PathAtlas"]
      >().toEqualTypeOf<PathAtlasCtor<TranslatedPathAtlas>>();
    });

    it("custom LK is reflected in config.localeKey", () => {
      expectTypeOf<
        NextAppFlatStrategy<
          TestAtlas,
          TestLocale,
          NamespaceMap<TestAtlas>,
          SimplePathAtlas,
          "lang"
        >["config"]["localeKey"]
      >().toEqualTypeOf<"lang">();
    });

    it("custom PAD affects client toolset return type", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["createClientToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>>
      >();
    });

    it("custom LK affects server toolset return type", () => {
      expectTypeOf<
        NextAppFlatStrategy<
          TestAtlas,
          TestLocale,
          NamespaceMap<TestAtlas>,
          SimplePathAtlas,
          "lang"
        >["createServerToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, "lang">>
      >();
    });

    it("different RA produce different types", () => {
      type OtherAtlas = { readonly other: { readonly value: number } };
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppFlatStrategy<OtherAtlas, TestLocale, NamespaceMap<OtherAtlas>>
      >();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, OtherLocale, NamespaceMap<TestAtlas>>
      >();
    });

    it("different PAD produce different types", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas>
      >().not.toEqualTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>>();
    });

    it("different LK produce different types", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, "locale">
      >().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, "lang">
      >();
    });

    it("different KA produce different types", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TestLocale, {}>
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

    it("rejects non-AnyPathAtlas as PAD", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, string>;
    });

    it("rejects non-string as LK", () => {
      // @ts-expect-error - number does not satisfy string constraint
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, number>;
    });

    it("rejects non-AnyLocale as L", () => {
      // @ts-expect-error - number does not satisfy AnyLocale (string)
      type _Invalid = NextAppFlatStrategy<TestAtlas, number>;
    });

    it("rejects non-NamespaceMap<TestAtlas> as KA", () => {
      // @ts-expect-error - string does not satisfy NamespaceMap<TestAtlas>
      type _Invalid = NextAppFlatStrategy<TestAtlas, TestLocale, string>;
    });
  });
});
