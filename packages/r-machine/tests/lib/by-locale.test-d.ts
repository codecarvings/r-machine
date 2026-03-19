import { describe, expectTypeOf, it } from "vitest";
import { byLocale } from "../../src/lib/by-locale.js";

describe("byLocale", () => {
  it("should preserve the return type of the factory", () => {
    const fn = byLocale((_locale) => ({
      date: (d: Date) => d.toISOString(),
      number: (n: number) => String(n),
    }));

    type Result = ReturnType<typeof fn>;
    expectTypeOf<Result>().toHaveProperty("date");
    expectTypeOf<Result>().toHaveProperty("number");
  });

  it("should accept a string locale parameter", () => {
    const fn = byLocale((_locale) => ({}));
    expectTypeOf(fn).parameter(0).toBeString();
  });

  it("should infer function signatures in the returned object", () => {
    const fn = byLocale((_locale) => ({
      format: (d: Date) => d.toISOString(),
    }));

    const result = fn("en");
    expectTypeOf(result.format).toBeFunction();
    expectTypeOf(result.format).parameter(0).toEqualTypeOf<Date>();
    expectTypeOf(result.format).returns.toBeString();
  });
});
