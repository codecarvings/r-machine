import type { RMachine } from "r-machine";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasCtor } from "#r-machine/next/core";
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
      type Ctor = new (rMachine: RMachine<TestAtlas, TestLocale>) => any;
      expectTypeOf<typeof NextAppPathStrategy>().toExtend<Ctor>();
    });

    it("2-arg overload: accepts rMachine and partial config", () => {
      type Ctor = new (
        rMachine: RMachine<TestAtlas, TestLocale>,
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
    it("PA defaults to defaultConfig PathAtlas instance", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["PathAtlas"]>().toEqualTypeOf<PathAtlasCtor<DefaultPA>>();
    });

    it("LK defaults to defaultConfig localeKey", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["localeKey"]>().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // Public properties
  // -----------------------------------------------------------------------

  describe("public properties", () => {
    it("rMachine is RMachine<RA, L>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, TestLocale>>();
    });

    it("config.cookie is CookieOption", () => {
      type CookieOption = "on" | "off" | CookieDeclaration;
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["cookie"]>().toEqualTypeOf<CookieOption>();
    });

    it("config.localeLabel is LocaleLabelOption", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["localeLabel"]>().toEqualTypeOf<"strict" | "lowercase">();
    });

    it("config.autoLocaleBinding is SwitchableOption", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["autoLocaleBinding"]>().toEqualTypeOf<"on" | "off">();
    });

    it("config.basePath is string", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["basePath"]>().toEqualTypeOf<string>();
    });

    it("config.autoDetectLocale includes custom object form", () => {
      type CustomAutoDetectLocale = { readonly pathMatcher: RegExp | null };
      expectTypeOf<{ readonly pathMatcher: null }>().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale>["config"]["autoDetectLocale"]
      >();
      expectTypeOf<CustomAutoDetectLocale>().toExtend<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["autoDetectLocale"]>();
    });

    it("config.autoDetectLocale accepts 'on' and 'off' string values", () => {
      expectTypeOf<"on">().toExtend<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["autoDetectLocale"]>();
      expectTypeOf<"off">().toExtend<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["autoDetectLocale"]>();
    });

    it("config.implicitDefaultLocale includes custom object form", () => {
      type CustomImplicitDefaultLocale = { readonly pathMatcher: RegExp | null };
      expectTypeOf<CustomImplicitDefaultLocale>().toExtend<
        NextAppPathStrategy<TestAtlas, TestLocale>["config"]["implicitDefaultLocale"]
      >();
    });

    it("config.implicitDefaultLocale accepts 'on' and 'off' string values", () => {
      expectTypeOf<"on">().toExtend<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["implicitDefaultLocale"]>();
      expectTypeOf<"off">().toExtend<NextAppPathStrategy<TestAtlas, TestLocale>["config"]["implicitDefaultLocale"]>();
    });
  });

  // -----------------------------------------------------------------------
  // Toolset return types
  // -----------------------------------------------------------------------

  describe("toolset return types", () => {
    it("createClientToolset returns Promise<NextAppClientToolset<RA, L, DefaultPA>>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["createClientToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, DefaultPA>>
      >();
    });

    it("createClientToolset accepts no parameters", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["createClientToolset"]>().parameters.toEqualTypeOf<[]>();
    });

    it("createServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["createServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createServerToolset returns Promise<NextAppServerToolset<RA, L, DefaultPA, DefaultLK>>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["createServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, TestLocale, DefaultPA, DefaultLK>>
      >();
    });

    it("createNoProxyServerToolset accepts NextAppClientRMachine<L>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["createNoProxyServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    });

    it("createNoProxyServerToolset returns Promise<NextAppNoProxyServerToolset<RA, L, DefaultPA, DefaultLK>>", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>["createNoProxyServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppNoProxyServerToolset<TestAtlas, TestLocale, DefaultPA, DefaultLK>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PA is wired through to config.PathAtlas", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>["config"]["PathAtlas"]>().toEqualTypeOf<
        PathAtlasCtor<TranslatedPathAtlas>
      >();
    });

    it("custom LK is reflected in config.localeKey", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, SimplePathAtlas, "lang">["config"]["localeKey"]
      >().toEqualTypeOf<"lang">();
    });

    it("custom PA affects client toolset return type", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>["createClientToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, TranslatedPathAtlas>>
      >();
    });

    it("custom LK affects server toolset return type", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, SimplePathAtlas, "lang">["createServerToolset"]
      >().returns.toEqualTypeOf<Promise<NextAppServerToolset<TestAtlas, TestLocale, SimplePathAtlas, "lang">>>();
    });

    it("custom PA+LK affects no-proxy server toolset return type", () => {
      expectTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas, "lang">["createNoProxyServerToolset"]
      >().returns.toEqualTypeOf<Promise<NextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "lang">>>();
    });

    it("different RA produce different types", () => {
      type OtherAtlas = { readonly other: { readonly value: number } };
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>>().not.toEqualTypeOf<NextAppPathStrategy<OtherAtlas, TestLocale>>();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale>>().not.toEqualTypeOf<NextAppPathStrategy<TestAtlas, OtherLocale>>();
    });

    it("different PA produce different types", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, SimplePathAtlas>>().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<NextAppPathStrategy<TestAtlas, TestLocale, SimplePathAtlas, "locale">>().not.toEqualTypeOf<
        NextAppPathStrategy<TestAtlas, TestLocale, SimplePathAtlas, "lang">
      >();
    });
  });

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("getPath is a function that rejects non-string locale", () => {
      type GetPath = NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>["hrefHelper"]["getPath"];
      expectTypeOf<GetPath>().toBeFunction();

      const strategy = null! as NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>;
      // @ts-expect-error - locale must be string, not number
      strategy.hrefHelper.getPath(123, "/about");
    });

    it("getPath rejects paths not in PathSelector<PA>", () => {
      const strategy = null! as NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>;
      // @ts-expect-error - "/nonexistent" is not a valid path in TranslatedPathAtlas
      strategy.hrefHelper.getPath("en", "/nonexistent");
    });

    it("does not have getUrl property (unlike origin strategy)", () => {
      type Helper = NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>["hrefHelper"];
      expectTypeOf<Helper>().not.toHaveProperty("getUrl");
    });

    it("getPath returns string", () => {
      const strategy = null! as NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>;
      const result = strategy.hrefHelper.getPath("en", "/about");
      expectTypeOf(result).toBeString();
    });

    it("requires params for dynamic path segments", () => {
      const strategy = null! as NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>;
      // @ts-expect-error - params required for path with dynamic segment [id]
      strategy.hrefHelper.getPath("en", "/products/[id]");
    });

    it("does not require params for static paths", () => {
      const strategy = null! as NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>;
      strategy.hrefHelper.getPath("en", "/about");
    });

    it("params type is { id: string } for /products/[id]", () => {
      const strategy = null! as NextAppPathStrategy<TestAtlas, TestLocale, TranslatedPathAtlas>;
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

    it("rejects non-AnyPathAtlas as PA", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppPathStrategy<TestAtlas, TestLocale, string>;
    });

    it("rejects non-string as LK", () => {
      // @ts-expect-error - number does not satisfy string constraint
      type _Invalid = NextAppPathStrategy<TestAtlas, TestLocale, SimplePathAtlas, number>;
    });

    it("rejects non-AnyLocale as L", () => {
      // @ts-expect-error - number does not satisfy AnyLocale (string)
      type _Invalid = NextAppPathStrategy<TestAtlas, number>;
    });
  });
});
