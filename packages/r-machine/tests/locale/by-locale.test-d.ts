import { describe, expectTypeOf, it } from "vitest";
import { byLocale } from "../../src/locale/by-locale.js";

describe("byLocale", () => {
  it("should preserve the full return type of the factory including property types", () => {
    const fn = byLocale((_locale) => ({
      date: (d: Date) => d.toISOString(),
      number: (n: number) => String(n),
    }));

    type Result = ReturnType<typeof fn>;
    expectTypeOf<Result["date"]>().toEqualTypeOf<(d: Date) => string>();
    expectTypeOf<Result["number"]>().toEqualTypeOf<(n: number) => string>();
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
