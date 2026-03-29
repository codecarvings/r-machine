import type { AnyResourceAtlas, NamespaceMap, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { Strategy } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import { ReactBareStrategy } from "../../src/core/react-bare-strategy.js";
import type { ReactBareToolset } from "../../src/core/react-bare-toolset.js";

// ---------------------------------------------------------------------------
// Test resource atlas types
// ---------------------------------------------------------------------------

type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

type OtherAtlas = {
  readonly settings: { readonly theme: string };
};

// ---------------------------------------------------------------------------
// Class shape & inheritance
// ---------------------------------------------------------------------------

describe("ReactBareStrategy", () => {
  describe("class shape", () => {
    it("extends Strategy<RA, L, undefined>", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>().toExtend<
        Strategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, undefined>
      >();
    });

    it("is constructible with RMachine<RA, L> and undefined", () => {
      expectTypeOf(ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>,
        undefined
      );
    });

    it("constructor requires exactly two parameters", () => {
      expectTypeOf(
        ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>
      ).constructorParameters.toEqualTypeOf<
        [rMachine: RMachine<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>, config: undefined]
      >();
    });

    it("rMachine property is typed as RMachine<RA, L>", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>
      >();
    });

    it("config property is typed as undefined", () => {
      expectTypeOf<
        ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>["config"]
      >().toEqualTypeOf<undefined>();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactBareToolset<RA, L>>", () => {
      expectTypeOf<
        ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>["createToolset"]
      >().returns.toEqualTypeOf<Promise<ReactBareToolset<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>>();
    });

    it("takes no parameters", () => {
      expectTypeOf<
        ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>["createToolset"]
      >().parameters.toEqualTypeOf<[]>();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<
        ReturnType<ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>["createToolset"]>
      >;
      expectTypeOf<Result>().toEqualTypeOf<ReactBareToolset<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>();
    });
  });

  // -----------------------------------------------------------------------
  // Generic type parameter constraints
  // -----------------------------------------------------------------------

  describe("generic type parameter", () => {
    it("RA must extend AnyResourceAtlas", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>().toExtend<
        Strategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, undefined>
      >();
      expectTypeOf<ReactBareStrategy<AnyResourceAtlas, AnyLocale, NamespaceMap<AnyResourceAtlas>>>().toBeObject();
    });

    it("different atlas types produce different strategy types", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
        ReactBareStrategy<OtherAtlas, AnyLocale, NamespaceMap<OtherAtlas>>
      >();
    });

    it("different atlas types produce different toolset return types", () => {
      type ToolsetA = Awaited<
        ReturnType<ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>["createToolset"]>
      >;
      type ToolsetB = Awaited<
        ReturnType<ReactBareStrategy<OtherAtlas, AnyLocale, NamespaceMap<OtherAtlas>>["createToolset"]>
      >;
      expectTypeOf<ToolsetA>().not.toEqualTypeOf<ToolsetB>();
    });

    it("strategy with AnyResourceAtlas is instantiable", () => {
      expectTypeOf<ReactBareStrategy<AnyResourceAtlas, AnyLocale, NamespaceMap<AnyResourceAtlas>>>().toBeObject();
    });
  });

  // -----------------------------------------------------------------------
  // Structural compatibility
  // -----------------------------------------------------------------------

  describe("structural compatibility", () => {
    it("is not assignable to Strategy with a non-undefined config", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>().not.toExtend<
        Strategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>, string>
      >();
    });

    it("is not assignable to Strategy with a different atlas", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale, NamespaceMap<TestAtlas>>>().not.toExtend<
        Strategy<OtherAtlas, AnyLocale, NamespaceMap<OtherAtlas>, undefined>
      >();
    });
  });
});

// ---------------------------------------------------------------------------
// Narrowed Locale type
// ---------------------------------------------------------------------------

describe("narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("strategy with narrowed locale produces a narrowed toolset", () => {
    type Result = Awaited<
      ReturnType<ReactBareStrategy<TestAtlas, AppLocale, NamespaceMap<TestAtlas>>["createToolset"]>
    >;
    expectTypeOf<Result>().toEqualTypeOf<ReactBareToolset<TestAtlas, AppLocale, NamespaceMap<TestAtlas>>>();
  });

  it("rMachine property uses the narrowed locale", () => {
    expectTypeOf<ReactBareStrategy<TestAtlas, AppLocale, NamespaceMap<TestAtlas>>["rMachine"]>().toEqualTypeOf<
      RMachine<TestAtlas, AppLocale, NamespaceMap<TestAtlas>>
    >();
  });

  it("narrowed strategy is not assignable to differently-narrowed strategy", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<ReactBareStrategy<TestAtlas, AppLocale, NamespaceMap<TestAtlas>>>().not.toEqualTypeOf<
      ReactBareStrategy<TestAtlas, OtherLocale, NamespaceMap<TestAtlas>>
    >();
  });
});
