import type { NamespaceMap, RMachine } from "r-machine";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasDeclarationCtor } from "#r-machine/next/core";
import type {
  NextAppClientRMachine,
  NextAppClientToolset,
  NextAppNoProxyServerToolset,
  NextAppServerToolset,
  PartialNextAppPathStrategyConfig,
} from "#r-machine/next/core/app";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppPathStrategyCore } from "#r-machine/next/core/app";
import { NextAppPathStrategy } from "../../src/app/next-app-path-strategy.js";
import type { SimplePathAtlas, TestLocale, TranslatedPathAtlas } from "../_fixtures/constants.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

// Derive default type parameters from public API — no internal imports
type DefaultPA = InstanceType<(typeof NextAppPathStrategyCore)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppPathStrategyCore)["defaultConfig"]["localeKey"];

// ---------------------------------------------------------------------------
// NextAppPathStrategy
// ---------------------------------------------------------------------------

describe("NextAppPathStrategy", () => {
  // -----------------------------------------------------------------------
  // Constructability & overloads
  // -----------------------------------------------------------------------

  describe("constructability", () => {
    it("is not abstract (can be instantiated)", () => {
      expectTypeOf<typeof NextAppPathStrategy>().toExtend<new (...args: any[]) => any>();
    });

    it("1-arg overload: accepts rMachine only", () => {
      type Ctor = new (rMachine: RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>) => any;
      expectTypeOf<typeof NextAppPathStrategy>().toExtend<Ctor>();
    });

    it("2-arg overload: accepts rMachine and partial config", () => {
      type Ctor = new (
        rMachine: RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>,
        config: PartialNextAppPathStrategyConfig<DefaultPA, DefaultLK>
      ) => any;
      expectTypeOf<typeof NextAppPathStrategy>().toExtend<Ctor>();
    });

    it("rejects 0 arguments", () => {
      // @ts-expect-error - constructor requires at least rMachine
      new NextAppPathStrategy();
    });
  });

  // -----------------------------------------------------------------------
  // Default type parameters
  // -----------------------------------------------------------------------

  describe("default type parameters", () => {
    it("PAD defaults to defaultConfig PathAtlas instance", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["PathAtlas"]
      >().toEqualTypeOf<PathAtlasDeclarationCtor<DefaultPA>>();
    });

    it("LK defaults to defaultConfig localeKey", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["localeKey"]
      >().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // Public properties
  // -----------------------------------------------------------------------

  describe("public properties", () => {
    it("rMachine is RMachine<RA, L>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>
      >();
    });

    it("config.cookie is CookieOption", () => {
      type CookieOption = "on" | "off" | CookieDeclaration;
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["cookie"]
      >().toEqualTypeOf<CookieOption>();
    });

    it("config.localeLabel is LocaleLabelOption", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["localeLabel"]
      >().toEqualTypeOf<"strict" | "lowercase">();
    });

    it("config.autoLocaleBinding is SwitchableOption", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["autoLocaleBinding"]
      >().toEqualTypeOf<"on" | "off">();
    });

    it("config.basePath is string", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["basePath"]
      >().toEqualTypeOf<string>();
    });

    it("config.autoDetectLocale includes custom object form", () => {
      type CustomAutoDetectLocale = { readonly pathMatcher: RegExp | null };
      expectTypeOf<{ readonly pathMatcher: null }>().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["autoDetectLocale"]
      >();
      expectTypeOf<CustomAutoDetectLocale>().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["autoDetectLocale"]
      >();
    });

    it("config.autoDetectLocale accepts 'on' and 'off' string values", () => {
      expectTypeOf<"on">().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["autoDetectLocale"]
      >();
      expectTypeOf<"off">().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["autoDetectLocale"]
      >();
    });

    it("config.implicitDefaultLocale includes custom object form", () => {
      type CustomImplicitDefaultLocale = { readonly pathMatcher: RegExp | null };
      expectTypeOf<CustomImplicitDefaultLocale>().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["implicitDefaultLocale"]
      >();
    });

    it("config.implicitDefaultLocale accepts 'on' and 'off' string values", () => {
      expectTypeOf<"on">().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["implicitDefaultLocale"]
      >();
      expectTypeOf<"off">().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["implicitDefaultLocale"]
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Toolset return types
  // -----------------------------------------------------------------------

  describe("toolset return types", () => {
    it("createClientToolset returns Promise<NextAppClientToolset<RA, L, DefaultPA>>", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createClientToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, DefaultPA>>
      >();
    });

    it("createClientToolset accepts no parameters", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createClientToolset"]
      >().parameters.toEqualTypeOf<[]>();
    });

    it("createServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createServerToolset returns Promise<NextAppServerToolset<RA, L, DefaultPA, DefaultLK>>", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createServerToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, DefaultPA, DefaultLK>>
      >();
    });

    it("createNoProxyServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createNoProxyServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createNoProxyServerToolset returns Promise<NextAppNoProxyServerToolset<RA, L, DefaultPA, DefaultLK>>", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["createNoProxyServerToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppNoProxyServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, DefaultPA, DefaultLK>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PAD is wired through to config.PathAtlas", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["config"]["PathAtlas"]
      >().toEqualTypeOf<PathAtlasDeclarationCtor<TranslatedPathAtlas>>();
    });

    it("custom LK is reflected in config.localeKey", () => {
      expectTypeOf<
        NextAppPathStrategy<
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
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["createClientToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>>
      >();
    });

    it("custom LK affects server toolset return type", () => {
      expectTypeOf<
        NextAppPathStrategy<
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

    it("custom PAD+LK affects no-proxy server toolset return type", () => {
      expectTypeOf<
        NextAppPathStrategy<
          TestAtlas,
          TestLocale,
          NamespaceMap<TestAtlas>,
          TranslatedPathAtlas,
          "lang"
        >["createNoProxyServerToolset"]
      >().returns.toEqualTypeOf<
        Promise<
          NextAppNoProxyServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "lang">
        >
      >();
    });

    it("different RA produce different types", () => {
      type OtherAtlas = { readonly other: { readonly value: number } };
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppPathStrategy<OtherAtlas, TestLocale, NamespaceMap<OtherAtlas>>
      >();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, OtherLocale, NamespaceMap<TestAtlas>>
      >();
    });

    it("different PAD produce different types", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas>
      >().not.toEqualTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>>();
    });

    it("different LK produce different types", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, "locale">
      >().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, "lang">
      >();
    });

    it("different KA produce different types", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, {}>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("getPath is a function that rejects non-string locale", () => {
      type GetPath = NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >["hrefHelper"]["getPath"];
      expectTypeOf<GetPath>().toBeFunction();

      const strategy = null! as NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      // @ts-expect-error - locale must be string, not number
      strategy.hrefHelper.getPath(123, "/about");
    });

    it("getPath rejects paths not in PathSelector<PAD>", () => {
      const strategy = null! as NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      // @ts-expect-error - "/nonexistent" is not a valid path in TranslatedPathAtlas
      strategy.hrefHelper.getPath("en", "/nonexistent");
    });

    it("does not have getUrl property (unlike origin strategy)", () => {
      type Helper = NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >["hrefHelper"];
      expectTypeOf<Helper>().not.toHaveProperty("getUrl");
    });

    it("getPath returns string", () => {
      const strategy = null! as NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      const result = strategy.hrefHelper.getPath("en", "/about");
      expectTypeOf(result).toBeString();
    });

    it("requires params for dynamic path segments", () => {
      const strategy = null! as NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      // @ts-expect-error - params required for path with dynamic segment [id]
      strategy.hrefHelper.getPath("en", "/products/[id]");
    });

    it("does not require params for static paths", () => {
      const strategy = null! as NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      strategy.hrefHelper.getPath("en", "/about");
    });

    it("params type is { id: string } for /products/[id]", () => {
      const strategy = null! as NextAppPathStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      const result = strategy.hrefHelper.getPath("en", "/products/[id]", { id: "42" });
      expectTypeOf(result).toBeString();
    });
  });

  // -----------------------------------------------------------------------
  // Type constraint violations
  // -----------------------------------------------------------------------

  describe("type constraint violations", () => {
    it("rejects non-AnyResourceAtlas as RA", () => {
      // @ts-expect-error - string does not satisfy AnyResourceAtlas
      type _Invalid = NextAppPathStrategy<string, TestLocale>;
    });

    it("rejects non-AnyPathAtlasDeclaration as PAD", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlasDeclaration
      type _Invalid = NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, string>;
    });

    it("rejects non-string as LK", () => {
      // @ts-expect-error - number does not satisfy string constraint
      type _Invalid = NextAppPathStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, number>;
    });

    it("rejects non-AnyLocale as L", () => {
      // @ts-expect-error - number does not satisfy AnyLocale (string)
      type _Invalid = NextAppPathStrategy<TestAtlas, number>;
    });

    it("rejects non-NamespaceMap<TestAtlas> as KA", () => {
      // @ts-expect-error - string does not satisfy NamespaceMap<TestAtlas>
      type _Invalid = NextAppPathStrategy<TestAtlas, TestLocale, string>;
    });
  });
});
