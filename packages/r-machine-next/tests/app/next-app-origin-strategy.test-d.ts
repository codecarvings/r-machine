import type { RMachine } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasCtor } from "#r-machine/next/core";
import type {
  NextAppClientToolset,
  NextAppOriginStrategyConfig,
  NextAppServerToolset,
  NextAppStrategyCore,
  PartialNextAppOriginStrategyConfig,
} from "#r-machine/next/core/app";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppOriginStrategyCore } from "#r-machine/next/core/app";
import { NextAppOriginStrategy } from "../../src/app/next-app-origin-strategy.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

// Derive default type parameters from public API — no internal imports
type DefaultPA = InstanceType<(typeof NextAppOriginStrategyCore)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppOriginStrategyCore)["defaultConfig"]["localeKey"];
type DefaultConfig = NextAppOriginStrategyConfig<DefaultPA, DefaultLK>;

type SimplePathAtlas = { readonly decl: {} };

type TranslatedPathAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo" };
    readonly "/products": {
      readonly it: "/prodotti";
      readonly "/[id]": {};
    };
  };
};

// ---------------------------------------------------------------------------
// NextAppOriginStrategy
// ---------------------------------------------------------------------------

describe("NextAppOriginStrategy", () => {
  // -----------------------------------------------------------------------
  // Class hierarchy
  // -----------------------------------------------------------------------

  describe("class hierarchy", () => {
    it("extends NextAppOriginStrategyCore with the correct config type", () => {
      expectTypeOf<NextAppOriginStrategy<TestAtlas>>().toExtend<NextAppOriginStrategyCore<TestAtlas, DefaultConfig>>();
    });

    it("extends NextAppStrategyCore through the chain", () => {
      expectTypeOf<NextAppOriginStrategy<TestAtlas>>().toExtend<NextAppStrategyCore<TestAtlas, DefaultConfig>>();
    });
  });

  // -----------------------------------------------------------------------
  // Constructability
  // -----------------------------------------------------------------------

  describe("constructability", () => {
    it("is not abstract (can be instantiated)", () => {
      expectTypeOf<typeof NextAppOriginStrategy>().toExtend<new (...args: any[]) => any>();
    });

    it("accepts rMachine and config", () => {
      type Ctor = new (
        rMachine: RMachine<TestAtlas>,
        config: PartialNextAppOriginStrategyConfig<DefaultPA, DefaultLK>
      ) => any;
      expectTypeOf<typeof NextAppOriginStrategy>().toExtend<Ctor>();
    });

    it("rejects construction with only rMachine (no 1-arg overload)", () => {
      // @ts-expect-error - config is required
      new NextAppOriginStrategy(null! as RMachine<TestAtlas>);
    });

    it("config must include localeOriginMap", () => {
      type ConfigParam = ConstructorParameters<typeof NextAppOriginStrategy<TestAtlas>>[1];
      expectTypeOf<ConfigParam>().toHaveProperty("localeOriginMap");
    });

    it("rejects config without localeOriginMap", () => {
      // @ts-expect-error - localeOriginMap is required in config
      new NextAppOriginStrategy(null! as RMachine<TestAtlas>, {
        basePath: "/docs",
      });
    });
  });

  // -----------------------------------------------------------------------
  // Default type parameters
  // -----------------------------------------------------------------------

  describe("default type parameters", () => {
    it("PA defaults to defaultConfig PathAtlas constructor", () => {
      expectTypeOf<NextAppOriginStrategy<TestAtlas>["config"]["PathAtlas"]>().toEqualTypeOf<PathAtlasCtor<DefaultPA>>();
    });

    it("LK defaults to defaultConfig localeKey", () => {
      expectTypeOf<NextAppOriginStrategy<TestAtlas>["config"]["localeKey"]>().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PA is wired through to config.PathAtlas", () => {
      expectTypeOf<NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>["config"]["PathAtlas"]>().toEqualTypeOf<
        PathAtlasCtor<TranslatedPathAtlas>
      >();
    });

    it("custom LK is reflected in config.localeKey", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, SimplePathAtlas, "lang">["config"]["localeKey"]
      >().toEqualTypeOf<"lang">();
    });

    it("custom PA affects client toolset return type", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>["createClientToolset"]
      >().returns.toEqualTypeOf<Promise<NextAppClientToolset<TestAtlas, TranslatedPathAtlas>>>();
    });

    it("custom LK affects server toolset return type", () => {
      expectTypeOf<
        NextAppOriginStrategy<TestAtlas, SimplePathAtlas, "lang">["createServerToolset"]
      >().returns.toEqualTypeOf<Promise<NextAppServerToolset<TestAtlas, SimplePathAtlas, "lang">>>();
    });

    it("different RA produce different types", () => {
      type OtherAtlas = { readonly other: { readonly value: number } };
      expectTypeOf<NextAppOriginStrategy<TestAtlas>>().not.toEqualTypeOf<NextAppOriginStrategy<OtherAtlas>>();
    });

    it("different PA produce different types", () => {
      expectTypeOf<NextAppOriginStrategy<TestAtlas, SimplePathAtlas>>().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<NextAppOriginStrategy<TestAtlas, SimplePathAtlas, "locale">>().not.toEqualTypeOf<
        NextAppOriginStrategy<TestAtlas, SimplePathAtlas, "lang">
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
      const strategy = null! as NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>;
      const result = strategy.hrefHelper.getPath("en", "/about");
      expectTypeOf(result).toBeString();
    });

    it("getUrl returns string", () => {
      const strategy = null! as NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>;
      const result = strategy.hrefHelper.getUrl("en", "/about");
      expectTypeOf(result).toBeString();
    });

    it("requires params for dynamic path segments", () => {
      const strategy = null! as NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>;
      // @ts-expect-error - params required for path with dynamic segment [id]
      strategy.hrefHelper.getPath("en", "/products/[id]");
    });

    it("does not require params for static paths", () => {
      const strategy = null! as NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>;
      strategy.hrefHelper.getPath("en", "/about");
    });

    it("params type is { id: string } for /products/[id]", () => {
      const strategy = null! as NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>;
      const result = strategy.hrefHelper.getPath("en", "/products/[id]", {
        id: "42",
      });
      expectTypeOf(result).toBeString();
    });

    it("getUrl composes origin with translated path", () => {
      const strategy = null! as NextAppOriginStrategy<TestAtlas, TranslatedPathAtlas>;
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
      type _Invalid = NextAppOriginStrategy<string>;
    });

    it("rejects non-AnyPathAtlas as PA", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppOriginStrategy<TestAtlas, string>;
    });

    it("rejects non-string as LK", () => {
      // @ts-expect-error - number does not satisfy string constraint
      type _Invalid = NextAppOriginStrategy<TestAtlas, SimplePathAtlas, number>;
    });
  });
});
