import { describe, expectTypeOf, it } from "vitest";
import type { CookiesFn, HeadersFn, NextProxy, NextProxyResult, Prettify } from "../../../src/internal/index.js";
import { defaultPathMatcher, setCookie, validateServerOnlyUsage } from "../../../src/internal/index.js";

describe("internal barrel exports", () => {
  it("should export defaultPathMatcher as a RegExp", () => {
    expectTypeOf(defaultPathMatcher).toEqualTypeOf<RegExp>();
  });

  it("should export setCookie as a function", () => {
    expectTypeOf(setCookie).toBeFunction();
  });

  it("should export validateServerOnlyUsage as a function", () => {
    expectTypeOf(validateServerOnlyUsage).toBeFunction();
  });

  it("should export CookiesFn as a function type", () => {
    expectTypeOf<CookiesFn>().toBeFunction();
  });

  it("should export HeadersFn as a function type", () => {
    expectTypeOf<HeadersFn>().toBeFunction();
  });

  it("should export NextProxy as a function type", () => {
    expectTypeOf<NextProxy>().toBeFunction();
  });

  it("should export NextProxyResult as a type", () => {
    expectTypeOf<null>().toExtend<NextProxyResult>();
    expectTypeOf<undefined>().toExtend<NextProxyResult>();
  });

  it("should export Prettify as an identity mapped type", () => {
    type Result = Prettify<{ a: string; b: number }>;
    expectTypeOf<Result>().toEqualTypeOf<{ a: string; b: number }>();
  });
});
