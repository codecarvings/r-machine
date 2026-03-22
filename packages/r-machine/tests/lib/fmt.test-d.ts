import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyFmt,
  AnyFmtGetter,
  AnyFmtProvider,
  EmptyFmt,
  EmptyFmtProvider,
  ExtractFmt,
  FmtGetter,
  FmtProvider,
  FmtProviderCtor,
} from "../../src/lib/fmt.js";
import { EmptyFmtProviderCtor, FormattersSeed } from "../../src/lib/fmt.js";

describe("AnyFmt", () => {
  it("should be object", () => {
    expectTypeOf<AnyFmt>().toEqualTypeOf<object>();
  });
});

describe("FmtGetter", () => {
  it("should be a function from locale to formatter", () => {
    expectTypeOf<FmtGetter<"en", { n: number }>>().toEqualTypeOf<(locale: "en") => { n: number }>();
  });
});

describe("AnyFmtGetter", () => {
  it("should be a function from string to AnyFmt", () => {
    expectTypeOf<AnyFmtGetter>().toEqualTypeOf<(locale: string) => object>();
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
  it("should accept FmtProvider", () => {
    expectTypeOf<FmtProvider<any, any>>().toExtend<AnyFmtProvider>();
  });
});

describe("EmptyFmtProvider", () => {
  it("should be a FmtProvider<string, EmptyFmt>", () => {
    expectTypeOf<EmptyFmtProvider>().toExtend<FmtProvider<string, EmptyFmt>>();
  });

  it("should extend AnyFmtProvider", () => {
    expectTypeOf<EmptyFmtProvider>().toExtend<AnyFmtProvider>();
  });

  it("EmptyFmt should be an empty object type", () => {
    expectTypeOf<EmptyFmt>().toEqualTypeOf<{}>();
  });
});

describe("EmptyFmtProviderCtor", () => {
  it("should be a FmtProviderCtor<EmptyFmtProvider>", () => {
    expectTypeOf(EmptyFmtProviderCtor).toExtend<FmtProviderCtor<EmptyFmtProvider>>();
  });

  it("static get should return EmptyFmt", () => {
    expectTypeOf(EmptyFmtProviderCtor.get("en")).toEqualTypeOf<EmptyFmt>();
  });
});

describe("FmtProviderCtor", () => {
  it("should be constructible", () => {
    type Ctor = FmtProviderCtor<FmtProvider<string, { n: number }>>;
    expectTypeOf<Ctor>().toBeConstructibleWith();
  });

  it("should have static get", () => {
    type Ctor = FmtProviderCtor<FmtProvider<"en", { n: number }>>;
    expectTypeOf<Ctor["get"]>().toEqualTypeOf<FmtGetter<"en", { n: number }>>();
  });

  it("instances should implement FmtProvider", () => {
    type Ctor = FmtProviderCtor<FmtProvider<string, { n: number }>>;
    expectTypeOf<InstanceType<Ctor>>().toExtend<FmtProvider<string, { n: number }>>();
  });
});

describe("ExtractFmt", () => {
  it("should extract the formatter type from a FmtProvider", () => {
    type P = FmtProvider<string, { date: (d: Date) => string }>;
    expectTypeOf<ExtractFmt<P>>().toEqualTypeOf<{ date: (d: Date) => string }>();
  });

  it("should extract EmptyFmt from EmptyFmtProvider", () => {
    expectTypeOf<ExtractFmt<EmptyFmtProvider>>().toEqualTypeOf<EmptyFmt>();
  });
});

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
