import type { AnyResourceAtlas, RMachine } from "r-machine";
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
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>>().toExtend<Strategy<TestAtlas, AnyLocale, undefined>>();
    });

    it("is constructible with RMachine<RA, L> and undefined", () => {
      expectTypeOf(ReactBareStrategy<TestAtlas, AnyLocale>).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale>,
        undefined
      );
    });

    it("constructor requires exactly two parameters", () => {
      expectTypeOf(ReactBareStrategy<TestAtlas, AnyLocale>).constructorParameters.toEqualTypeOf<
        [rMachine: RMachine<TestAtlas, AnyLocale>, config: undefined]
      >();
    });

    it("rMachine property is typed as RMachine<RA, L>", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, AnyLocale>
      >();
    });

    it("config property is typed as undefined", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>["config"]>().toEqualTypeOf<undefined>();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactBareToolset<RA, L>>", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>["createToolset"]>().returns.toEqualTypeOf<
        Promise<ReactBareToolset<TestAtlas, AnyLocale>>
      >();
    });

    it("takes no parameters", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>["createToolset"]>().parameters.toEqualTypeOf<[]>();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<ReturnType<ReactBareStrategy<TestAtlas, AnyLocale>["createToolset"]>>;
      expectTypeOf<Result>().toEqualTypeOf<ReactBareToolset<TestAtlas, AnyLocale>>();
    });
  });

  // -----------------------------------------------------------------------
  // Generic type parameter constraints
  // -----------------------------------------------------------------------

  describe("generic type parameter", () => {
    it("RA must extend AnyResourceAtlas", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>>().toExtend<Strategy<TestAtlas, AnyLocale, undefined>>();
      expectTypeOf<ReactBareStrategy<AnyResourceAtlas, AnyLocale>>().toBeObject();
    });

    it("different atlas types produce different strategy types", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>>().not.toEqualTypeOf<
        ReactBareStrategy<OtherAtlas, AnyLocale>
      >();
    });

    it("different atlas types produce different toolset return types", () => {
      type ToolsetA = Awaited<ReturnType<ReactBareStrategy<TestAtlas, AnyLocale>["createToolset"]>>;
      type ToolsetB = Awaited<ReturnType<ReactBareStrategy<OtherAtlas, AnyLocale>["createToolset"]>>;
      expectTypeOf<ToolsetA>().not.toEqualTypeOf<ToolsetB>();
    });

    it("strategy with AnyResourceAtlas is a supertype", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>>().toExtend<
        ReactBareStrategy<AnyResourceAtlas, AnyLocale>
      >();
    });
  });

  // -----------------------------------------------------------------------
  // Structural compatibility
  // -----------------------------------------------------------------------

  describe("structural compatibility", () => {
    it("is not assignable to Strategy with a non-undefined config", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>>().not.toExtend<Strategy<TestAtlas, AnyLocale, string>>();
    });

    it("is not assignable to Strategy with a different atlas", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas, AnyLocale>>().not.toExtend<
        Strategy<OtherAtlas, AnyLocale, undefined>
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
    type Result = Awaited<ReturnType<ReactBareStrategy<TestAtlas, AppLocale>["createToolset"]>>;
    expectTypeOf<Result>().toEqualTypeOf<ReactBareToolset<TestAtlas, AppLocale>>();
  });

  it("rMachine property uses the narrowed locale", () => {
    expectTypeOf<ReactBareStrategy<TestAtlas, AppLocale>["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, AppLocale>>();
  });

  it("narrowed strategy is not assignable to differently-narrowed strategy", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<ReactBareStrategy<TestAtlas, AppLocale>>().not.toEqualTypeOf<
      ReactBareStrategy<TestAtlas, OtherLocale>
    >();
  });
});
