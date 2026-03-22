import { describe, expectTypeOf, it } from "vitest";
import { FormattersSeed } from "../../src/lib/formatters-seed.js";

describe("FormattersSeed.create", () => {
  it("should return a FmtProviderCtor", () => {
    const Fmt = FormattersSeed.create((_locale: string) => ({ n: 42 }));
    expectTypeOf(Fmt).toBeConstructibleWith();
    expectTypeOf(Fmt.get).toBeFunction();
  });

  it("should infer the formatter type from the factory return", () => {
    const Fmt = FormattersSeed.create((_locale: string) => ({
      date: (d: Date) => d.toISOString(),
      number: (n: number) => String(n),
    }));

    type Result = ReturnType<typeof Fmt.get>;
    expectTypeOf<Result["date"]>().toEqualTypeOf<(d: Date) => string>();
    expectTypeOf<Result["number"]>().toEqualTypeOf<(n: number) => string>();
  });

  it("should preserve const inference on the formatter object", () => {
    const Fmt = FormattersSeed.create((_locale: string) => ({
      format: (d: Date) => d.toISOString(),
    }));

    const result = Fmt.get("en");
    expectTypeOf(result.format).toBeFunction();
    expectTypeOf(result.format).parameter(0).toEqualTypeOf<Date>();
    expectTypeOf(result.format).returns.toBeString();
  });

  it("instance .get should have the same type as static .get", () => {
    const Fmt = FormattersSeed.create((_locale: string) => ({ n: 42 }));
    const instance = new Fmt();
    expectTypeOf(instance.get).toEqualTypeOf(Fmt.get);
  });

  it("should infer locale type from the factory parameter", () => {
    const Fmt = FormattersSeed.create((_locale: "en" | "it") => ({ v: 1 }));
    expectTypeOf(Fmt.get).parameter(0).toEqualTypeOf<"en" | "it">();
  });
});
