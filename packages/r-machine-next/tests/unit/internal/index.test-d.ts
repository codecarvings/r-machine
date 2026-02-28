import { describe, expectTypeOf, it } from "vitest";
import type { CookiesFn, HeadersFn, NextProxy, NextProxyResult, Prettify } from "../../../src/internal/index.js";
import { defaultPathMatcher, setCookie, validateServerOnlyUsage } from "../../../src/internal/index.js";

describe("internal barrel exports", () => {
  it("exports all expected symbols", () => {
    type Result = Prettify<{ a: string; b: number }>;

    expectTypeOf(defaultPathMatcher).toEqualTypeOf<RegExp>();

    expectTypeOf(setCookie).toBeFunction();

    expectTypeOf(validateServerOnlyUsage).toBeFunction();

    expectTypeOf<CookiesFn>().toBeFunction();

    expectTypeOf<HeadersFn>().toBeFunction();

    expectTypeOf<NextProxy>().toBeFunction();

    expectTypeOf<null>().toExtend<NextProxyResult>();
    expectTypeOf<undefined>().toExtend<NextProxyResult>();

    expectTypeOf<Result>().toEqualTypeOf<{ a: string; b: number }>();
  });
});
