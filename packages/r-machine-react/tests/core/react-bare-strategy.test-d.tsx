import type { AnyResourceAtlas, RMachine } from "r-machine";
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
    it("extends Strategy<RA, undefined>", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>>().toExtend<Strategy<TestAtlas, undefined>>();
    });

    it("is constructible with RMachine<RA> and undefined", () => {
      expectTypeOf(ReactBareStrategy<TestAtlas>).toBeConstructibleWith({} as RMachine<TestAtlas>, undefined);
    });

    it("constructor requires exactly two parameters", () => {
      expectTypeOf(ReactBareStrategy<TestAtlas>).constructorParameters.toEqualTypeOf<
        [rMachine: RMachine<TestAtlas>, config: undefined]
      >();
    });

    it("rMachine property is typed as RMachine<RA>", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas>>();
    });

    it("config property is typed as undefined", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>["config"]>().toEqualTypeOf<undefined>();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactBareToolset<RA>>", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>["createToolset"]>().returns.toEqualTypeOf<
        Promise<ReactBareToolset<TestAtlas>>
      >();
    });

    it("takes no parameters", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>["createToolset"]>().parameters.toEqualTypeOf<[]>();
    });

    it("is a function", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>["createToolset"]>().toBeFunction();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<ReturnType<ReactBareStrategy<TestAtlas>["createToolset"]>>;
      expectTypeOf<Result>().toEqualTypeOf<ReactBareToolset<TestAtlas>>();
    });
  });

  // -----------------------------------------------------------------------
  // Generic type parameter constraints
  // -----------------------------------------------------------------------

  describe("generic type parameter", () => {
    it("RA must extend AnyResourceAtlas", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>>().toExtend<Strategy<TestAtlas, undefined>>();
      expectTypeOf<ReactBareStrategy<AnyResourceAtlas>>().toBeObject();
    });

    it("different atlas types produce different strategy types", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>>().not.toEqualTypeOf<ReactBareStrategy<OtherAtlas>>();
    });

    it("different atlas types produce different toolset return types", () => {
      type ToolsetA = Awaited<ReturnType<ReactBareStrategy<TestAtlas>["createToolset"]>>;
      type ToolsetB = Awaited<ReturnType<ReactBareStrategy<OtherAtlas>["createToolset"]>>;
      expectTypeOf<ToolsetA>().not.toEqualTypeOf<ToolsetB>();
    });

    it("strategy with AnyResourceAtlas is a supertype", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>>().toExtend<ReactBareStrategy<AnyResourceAtlas>>();
    });
  });

  // -----------------------------------------------------------------------
  // Structural compatibility
  // -----------------------------------------------------------------------

  describe("structural compatibility", () => {
    it("is not assignable to Strategy with a non-undefined config", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>>().not.toExtend<Strategy<TestAtlas, string>>();
    });

    it("is not assignable to Strategy with a different atlas", () => {
      expectTypeOf<ReactBareStrategy<TestAtlas>>().not.toExtend<Strategy<OtherAtlas, undefined>>();
    });
  });
});
