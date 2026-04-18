import type { NamespaceMap, RMachine } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasClass } from "#r-machine/next/core";
import type { NextAppClientToolset, NextAppServerToolset } from "#r-machine/next/core/app";
import type { PartialNextAppOriginStrategyConfig } from "#r-machine/next/core/app/origin";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppOriginStrategyCore } from "#r-machine/next/core/app/origin";
import { NextAppOriginStrategy } from "../../src/app/origin/next-app-origin-strategy.js";
import type { SimplePathAtlas, TestLocale, TranslatedPathAtlas } from "../_fixtures/constants.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

// Derive default type parameters from public API — no internal imports
type DefaultPA = InstanceType<(typeof NextAppOriginStrategyCore)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppOriginStrategyCore)["defaultConfig"]["localeKey"];

// ---------------------------------------------------------------------------
// NextAppOriginStrategy
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategy", () => {
  // -----------------------------------------------------------------------
  // Constructability
  // -----------------------------------------------------------------------

  describe("constructability", () => {
    it("is not abstract (can be instantiated)", () => {
      expectTypeOf<typeof NextAppOriginStrategy>().toExtend<new (...args: any[]) => any>();
    });

    it("accepts rMachine and config", () => {
      type Ctor = new (
        rMachine: RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>,
        config: PartialNextAppOriginStrategyConfig<DefaultPA, DefaultLK>
      ) => any;
      expectTypeOf<typeof NextAppOriginStrategy>().toExtend<Ctor>();
    });

    it("rejects construction with only rMachine (no 1-arg overload)", () => {
      // @ts-expect-error - config is required
      new NextAppOriginStrategy(null! as RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>);
    });

    it("config must include localeOriginMap", () => {
      type ConfigParam = ConstructorParameters<
        typeof NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>
      >[1];
      expectTypeOf<ConfigParam>().toHaveProperty("localeOriginMap");
    });

    it("rejects config without localeOriginMap", () => {
      // @ts-expect-error - localeOriginMap is required in config
      new NextAppOriginStrategy(null! as RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>, {
        basePath: "/docs",
      });
    });
  });

  // -----------------------------------------------------------------------
  // Default type parameters
  // -----------------------------------------------------------------------

  describe("default type parameters", () => {
    it("PAD defaults to defaultConfig PathAtlas constructor", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["PathAtlas"]
      >().toEqualTypeOf<PathAtlasClass<DefaultPA>>();
    });

    it("LK defaults to defaultConfig localeKey", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>["config"]["localeKey"]
      >().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PAD is wired through to config.PathAtlas", () => {
      expectTypeOf<
        NextAppOriginStrategy<
          TestAtlas,
          TestLocale,
          NamespaceMap<TestAtlas>,
          TranslatedPathAtlas
        >["config"]["PathAtlas"]
      >().toEqualTypeOf<PathAtlasClass<TranslatedPathAtlas>>();
    });

    it("custom LK is reflected in config.localeKey", () => {
      expectTypeOf<
        NextAppOriginStrategy<
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
        NextAppOriginStrategy<
          TestAtlas,
          TestLocale,
          NamespaceMap<TestAtlas>,
          TranslatedPathAtlas
        >["createClientToolset"]
      >().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>>
      >();
    });

    it("custom LK affects server toolset return type", () => {
      expectTypeOf<
        NextAppOriginStrategy<
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
      expectTypeOf<NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppOriginStrategy<OtherAtlas, TestLocale, NamespaceMap<OtherAtlas>>
      >();
    });

    it("different L produce different types", () => {
      type OtherLocale = "fr" | "de";
      expectTypeOf<NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, OtherLocale, NamespaceMap<TestAtlas>>
      >();
    });

    it("different PAD produce different types", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas>
      >().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, "locale">
      >().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, "lang">
      >();
    });

    it("different KA produce different types", () => {
      expectTypeOf<NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, TestLocale, {}>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Type constraint violations
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // hrefHelper
  // -----------------------------------------------------------------------

  describe("hrefHelper", () => {
    it("getPath returns string", () => {
      const strategy = null! as NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      const result = strategy.hrefHelper.getPath("en", "/about");
      expectTypeOf(result).toBeString();
    });

    it("getUrl returns string", () => {
      const strategy = null! as NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      const result = strategy.hrefHelper.getUrl("en", "/about");
      expectTypeOf(result).toBeString();
    });

    it("requires params for dynamic path segments", () => {
      const strategy = null! as NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      // @ts-expect-error - params required for path with dynamic segment [id]
      strategy.hrefHelper.getPath("en", "/products/[id]");
    });

    it("does not require params for static paths", () => {
      const strategy = null! as NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      strategy.hrefHelper.getPath("en", "/about");
    });

    it("params type is { id: string } for /products/[id]", () => {
      const strategy = null! as NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      const result = strategy.hrefHelper.getPath("en", "/products/[id]", {
        id: "42",
      });
      expectTypeOf(result).toBeString();
    });

    it("getUrl composes origin with translated path", () => {
      const strategy = null! as NextAppOriginStrategy<
        TestAtlas,
        TestLocale,
        NamespaceMap<TestAtlas>,
        TranslatedPathAtlas
      >;
      const result = strategy.hrefHelper.getUrl("it", "/products/[id]", {
        id: "42",
      });
      expectTypeOf(result).toBeString();
    });
  });

  // -----------------------------------------------------------------------
  // Type constraint violations
  // -----------------------------------------------------------------------

  describe("type constraint violations", () => {
    it("rejects non-AnyResourceAtlas as RA", () => {
      // @ts-expect-error - string does not satisfy AnyResourceAtlas
      type _Invalid = NextAppOriginStrategy<string, TestLocale>;
    });

    it("rejects non-AnyPathAtlas as PAD", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, string>;
    });

    it("rejects non-string as LK", () => {
      // @ts-expect-error - number does not satisfy string constraint
      type _Invalid = NextAppOriginStrategy<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, SimplePathAtlas, number>;
    });

    it("rejects non-AnyLocale as L", () => {
      // @ts-expect-error - number does not satisfy AnyLocale (string)
      type _Invalid = NextAppOriginStrategy<TestAtlas, number>;
    });

    it("rejects non-NamespaceMap<TestAtlas> as KA", () => {
      // @ts-expect-error - string does not satisfy NamespaceMap<TestAtlas>
      type _Invalid = NextAppOriginStrategy<TestAtlas, TestLocale, string>;
    });
  });
});
