import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyFmt,
  AnyFmtGetter,
  AnyFmtProvider,
  AnyFmtProviderCtor,
  ExtractFmt,
  ExtractFmtProvider,
  FmtGetter,
  FmtProvider,
  FmtProviderCtor,
} from "../../src/lib/fmt.js";
import { createFormatters } from "../../src/lib/fmt.js";

describe("AnyFmt", () => {
  it("should be object | undefined", () => {
    expectTypeOf<AnyFmt>().toEqualTypeOf<object | undefined>();
  });
});

describe("FmtGetter", () => {
  it("should be a function from locale to formatter", () => {
    expectTypeOf<FmtGetter<"en", { n: number }>>().toEqualTypeOf<(locale: "en") => { n: number }>();
  });
});

describe("AnyFmtGetter", () => {
  it("should be a function from string to AnyFmt", () => {
    expectTypeOf<AnyFmtGetter>().toEqualTypeOf<(locale: string) => object | undefined>();
  });
});

describe("FmtProvider", () => {
  it("should have readonly get property", () => {
    expectTypeOf<FmtProvider<string, { n: number }>>().toHaveProperty("get");
  });

  it("get should be a FmtGetter", () => {
    type P = FmtProvider<"en" | "it", { n: number }>;
    expectTypeOf<P["get"]>().toEqualTypeOf<FmtGetter<"en" | "it", { n: number }>>();
  });
});

describe("AnyFmtProvider", () => {
  it("should accept FmtProvider or undefined", () => {
    expectTypeOf<FmtProvider<any, any>>().toExtend<AnyFmtProvider>();
    expectTypeOf<undefined>().toExtend<AnyFmtProvider>();
  });
});

describe("FmtProviderCtor", () => {
  it("should be constructible", () => {
    type Ctor = FmtProviderCtor<string, { n: number }>;
    expectTypeOf<Ctor>().toBeConstructibleWith();
  });

  it("should have static get", () => {
    type Ctor = FmtProviderCtor<"en", { n: number }>;
    expectTypeOf<Ctor["get"]>().toEqualTypeOf<FmtGetter<"en", { n: number }>>();
  });

  it("instances should implement FmtProvider", () => {
    type Ctor = FmtProviderCtor<string, { n: number }>;
    expectTypeOf<InstanceType<Ctor>>().toExtend<FmtProvider<string, { n: number }>>();
  });
});

describe("AnyFmtProviderCtor", () => {
  it("should accept FmtProviderCtor or undefined", () => {
    expectTypeOf<FmtProviderCtor<any, any>>().toExtend<AnyFmtProviderCtor>();
    expectTypeOf<undefined>().toExtend<AnyFmtProviderCtor>();
  });
});

describe("ExtractFmtProvider", () => {
  it("should extract instance type from FmtProviderCtor", () => {
    type Ctor = FmtProviderCtor<string, { n: number }>;
    expectTypeOf<ExtractFmtProvider<Ctor>>().toExtend<FmtProvider<string, { n: number }>>();
  });

  it("should return undefined for non-constructor types", () => {
    expectTypeOf<ExtractFmtProvider<undefined>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractFmtProvider<string>>().toEqualTypeOf<undefined>();
  });
});

describe("ExtractFmt", () => {
  it("should extract the formatter type from a FmtProvider", () => {
    type P = FmtProvider<string, { date: (d: Date) => string }>;
    expectTypeOf<ExtractFmt<P>>().toEqualTypeOf<{ date: (d: Date) => string }>();
  });

  it("should return undefined for non-provider types", () => {
    expectTypeOf<ExtractFmt<undefined>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractFmt<string>>().toEqualTypeOf<undefined>();
  });
});

describe("createFormatters", () => {
  it("should return a FmtProviderCtor", () => {
    const Fmt = createFormatters((_locale: string) => ({ n: 42 }));
    expectTypeOf(Fmt).toBeConstructibleWith();
    expectTypeOf(Fmt.get).toBeFunction();
  });

  it("should infer the formatter type from the factory return", () => {
    const Fmt = createFormatters((_locale: string) => ({
      date: (d: Date) => d.toISOString(),
      number: (n: number) => String(n),
    }));

    type Result = ReturnType<typeof Fmt.get>;
    expectTypeOf<Result["date"]>().toEqualTypeOf<(d: Date) => string>();
    expectTypeOf<Result["number"]>().toEqualTypeOf<(n: number) => string>();
  });

  it("should preserve const inference on the formatter object", () => {
    const Fmt = createFormatters((_locale: string) => ({
      format: (d: Date) => d.toISOString(),
    }));

    const result = Fmt.get("en");
    expectTypeOf(result.format).toBeFunction();
    expectTypeOf(result.format).parameter(0).toEqualTypeOf<Date>();
    expectTypeOf(result.format).returns.toBeString();
  });

  it("instance .get should have the same type as static .get", () => {
    const Fmt = createFormatters((_locale: string) => ({ n: 42 }));
    const instance = new Fmt();
    expectTypeOf(instance.get).toEqualTypeOf(Fmt.get);
  });

  it("should infer locale type from the factory parameter", () => {
    const Fmt = createFormatters((_locale: "en" | "it") => ({ v: 1 }));
    expectTypeOf(Fmt.get).parameter(0).toEqualTypeOf<"en" | "it">();
  });
});
