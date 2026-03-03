import type { RMachine } from "r-machine";
import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import type { PathAtlasCtor } from "#r-machine/next/core";
import type {
  NextAppClientRMachine,
  NextAppClientToolset,
  NextAppFlatStrategyConfig,
  NextAppServerToolset,
  NextAppStrategyCore,
  PartialNextAppFlatStrategyConfig,
} from "#r-machine/next/core/app";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppFlatStrategyCore } from "#r-machine/next/core/app";
import type { NextAppFlatStrategy } from "../../src/app/next-app-flat-strategy.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

// Derive default type parameters from public API — no internal imports
type DefaultPA = InstanceType<(typeof NextAppFlatStrategyCore)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppFlatStrategyCore)["defaultConfig"]["localeKey"];
type DefaultConfig = NextAppFlatStrategyConfig<DefaultPA, DefaultLK>;

type SimplePathAtlas = { readonly decl: {} };

type TranslatedPathAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo" };
    readonly "/products": { readonly it: "/prodotti"; readonly "/[id]": {} };
  };
};

// ---------------------------------------------------------------------------
// NextAppFlatStrategy
// ---------------------------------------------------------------------------

describe("NextAppFlatStrategy", () => {
  // -----------------------------------------------------------------------
  // Class hierarchy
  // -----------------------------------------------------------------------

  describe("class hierarchy", () => {
    it("extends NextAppFlatStrategyCore with the correct config type", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>>().toExtend<NextAppFlatStrategyCore<TestAtlas, DefaultConfig>>();
    });

    it("extends NextAppStrategyCore through the chain", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>>().toExtend<NextAppStrategyCore<TestAtlas, DefaultConfig>>();
    });
  });

  // -----------------------------------------------------------------------
  // Constructability & overloads
  // -----------------------------------------------------------------------

  describe("constructability", () => {
    it("is not abstract (can be instantiated)", () => {
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<new (...args: any[]) => any>();
    });

    it("1-arg overload: accepts rMachine only", () => {
      type Ctor = new (rMachine: RMachine<TestAtlas>) => any;
      expectTypeOf<typeof NextAppFlatStrategy>().toExtend<Ctor>();
    });

    it("2-arg overload: accepts rMachine and partial config", () => {
      type Ctor = new (
        rMachine: RMachine<TestAtlas>,
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
      expectTypeOf<NextAppFlatStrategy<TestAtlas>>().toExtend<NextAppFlatStrategyCore<TestAtlas, DefaultConfig>>();
    });

    it("LK defaults to defaultConfig localeKey", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>["config"]["localeKey"]>().toEqualTypeOf<DefaultLK>();
    });
  });

  // -----------------------------------------------------------------------
  // Public properties
  // -----------------------------------------------------------------------

  describe("public properties", () => {
    it("rMachine is RMachine<RA>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas>>();
    });

    it("config.cookie is CookieDeclaration", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>["config"]["cookie"]>().toEqualTypeOf<CookieDeclaration>();
    });

    it("config.pathMatcher is RegExp | null", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>["config"]["pathMatcher"]>().toEqualTypeOf<RegExp | null>();
    });
  });

  // -----------------------------------------------------------------------
  // Toolset return types
  // -----------------------------------------------------------------------

  describe("toolset return types", () => {
    it("createClientToolset returns Promise<NextAppClientToolset<RA, DefaultPA>>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>["createClientToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, DefaultPA>>
      >();
    });

    it("createServerToolset accepts NextAppClientRMachine", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>["createServerToolset"]>()
        .parameter(0)
        .toEqualTypeOf<NextAppClientRMachine>();
    });

    it("createServerToolset returns Promise<NextAppServerToolset<RA, DefaultPA, DefaultLK>>", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas>["createServerToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppServerToolset<TestAtlas, DefaultPA, DefaultLK>>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Custom type parameters
  // -----------------------------------------------------------------------

  describe("custom type parameters", () => {
    it("custom PA is wired through to config.PathAtlas", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TranslatedPathAtlas>["config"]["PathAtlas"]>().toEqualTypeOf<
        PathAtlasCtor<TranslatedPathAtlas>
      >();
    });

    it("custom LK is reflected in config.localeKey", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, SimplePathAtlas, "lang">["config"]["localeKey"]
      >().toEqualTypeOf<"lang">();
    });

    it("custom PA affects client toolset return type", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, TranslatedPathAtlas>["createClientToolset"]>().returns.toEqualTypeOf<
        Promise<NextAppClientToolset<TestAtlas, TranslatedPathAtlas>>
      >();
    });

    it("custom LK affects server toolset return type", () => {
      expectTypeOf<
        NextAppFlatStrategy<TestAtlas, SimplePathAtlas, "lang">["createServerToolset"]
      >().returns.toEqualTypeOf<Promise<NextAppServerToolset<TestAtlas, SimplePathAtlas, "lang">>>();
    });

    it("different RA produce different types", () => {
      type OtherAtlas = { readonly other: { readonly value: number } };
      expectTypeOf<NextAppFlatStrategy<TestAtlas>>().not.toEqualTypeOf<NextAppFlatStrategy<OtherAtlas>>();
    });

    it("different PA produce different types", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, SimplePathAtlas>>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, TranslatedPathAtlas>
      >();
    });

    it("different LK produce different types", () => {
      expectTypeOf<NextAppFlatStrategy<TestAtlas, SimplePathAtlas, "locale">>().not.toEqualTypeOf<
        NextAppFlatStrategy<TestAtlas, SimplePathAtlas, "lang">
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Type constraint violations
  // -----------------------------------------------------------------------

  describe("type constraint violations", () => {
    it("rejects non-AnyResourceAtlas as RA", () => {
      // @ts-expect-error - string does not satisfy AnyResourceAtlas
      type _Invalid = NextAppFlatStrategy<string>;
    });

    it("rejects non-AnyPathAtlas as PA", () => {
      // @ts-expect-error - string does not satisfy AnyPathAtlas
      type _Invalid = NextAppFlatStrategy<TestAtlas, string>;
    });

    it("rejects non-string as LK", () => {
      // @ts-expect-error - number does not satisfy string constraint
      type _Invalid = NextAppFlatStrategy<TestAtlas, SimplePathAtlas, number>;
    });
  });
});
