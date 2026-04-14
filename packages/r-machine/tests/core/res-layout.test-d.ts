import { describe, expectTypeOf, it } from "vitest";
import {
  type AnyResLayout,
  createResLayoutEntryTypeResolver,
  createResPathResolver,
  type ResLayoutEntryType,
  type ResLayoutEntryTypeResolver,
  type ResPathResolver,
} from "../../src/core/res-layout.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResLayoutEntryType", () => {
  it("is the exact union of the three canonical layout literals", () => {
    expectTypeOf<ResLayoutEntryType>().toEqualTypeOf<"gear" | "shell" | "dynamic-shell">();
  });

  it("does not widen to string", () => {
    expectTypeOf<ResLayoutEntryType>().not.toEqualTypeOf<string>();
    expectTypeOf<string>().not.toExtend<ResLayoutEntryType>();
  });
});

describe("AnyResLayout", () => {
  it("indexes into ResLayoutEntryType for any string key", () => {
    expectTypeOf<AnyResLayout[string]>().toEqualTypeOf<ResLayoutEntryType>();
  });

  it("accepts the three canonical layout types as values", () => {
    expectTypeOf<"gear">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"shell">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"dynamic-shell">().toExtend<ResLayoutEntryType>();
  });

  it("rejects unrelated string literals as values", () => {
    expectTypeOf<"not-a-layout">().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<"Gear">().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<string>().not.toExtend<ResLayoutEntryType>();
  });

  it("does not accept non-string values", () => {
    expectTypeOf<number>().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<null>().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<undefined>().not.toExtend<ResLayoutEntryType>();
  });

  it("accepts an object literal whose values are layout types", () => {
    const layout = {
      app: "gear",
      "app/settings": "shell",
      "app/live": "dynamic-shell",
    } as const satisfies AnyResLayout;
    expectTypeOf(layout).toExtend<AnyResLayout>();
  });
});

describe("ResLayoutTypeResolver", () => {
  it("takes a namespace string and returns a layout type or undefined", () => {
    expectTypeOf<ResLayoutEntryTypeResolver>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ResLayoutEntryTypeResolver>().returns.toEqualTypeOf<ResLayoutEntryType | undefined>();
  });

  it("return type always includes undefined (misses are representable)", () => {
    expectTypeOf<undefined>().toExtend<ReturnType<ResLayoutEntryTypeResolver>>();
  });
});

describe("createResLayoutEntryTypeResolver", () => {
  it("accepts an AnyResLayout and returns a ResLayoutTypeResolver", () => {
    expectTypeOf(createResLayoutEntryTypeResolver).parameter(0).toEqualTypeOf<AnyResLayout>();
    expectTypeOf(createResLayoutEntryTypeResolver).returns.toEqualTypeOf<ResLayoutEntryTypeResolver>();
  });

  it("does not narrow the return type based on the literal input (runtime lookup is string-keyed)", () => {
    // The resolver is intentionally erased: even if we pass a narrowly-typed
    // literal, the returned function still accepts any namespace string and
    // still may return undefined. This guards against accidentally tightening
    // the API into a closed key set.
    const resolve = createResLayoutEntryTypeResolver({ app: "gear" } as const);
    expectTypeOf(resolve).toEqualTypeOf<ResLayoutEntryTypeResolver>();
    expectTypeOf(resolve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(resolve).returns.toEqualTypeOf<ResLayoutEntryType | undefined>();
  });

  it("rejects layouts whose values are not layout types", () => {
    // @ts-expect-error — "not-a-layout" is not assignable to ResLayoutType
    createResLayoutEntryTypeResolver({ app: "not-a-layout" });
    // @ts-expect-error — numbers are not layout types
    createResLayoutEntryTypeResolver({ app: 42 });
  });
});

describe("ResPathResolver", () => {
  it("takes (namespace, locale | undefined) and returns a string", () => {
    expectTypeOf<ResPathResolver>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ResPathResolver>().parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<ResPathResolver>().returns.toEqualTypeOf<string>();
  });

  it("does not allow omitting the locale argument (undefined must be passed explicitly)", () => {
    const resolve: ResPathResolver = (ns) => ns;
    // @ts-expect-error — locale parameter is required even when undefined
    resolve("app");
    // Baseline: explicit undefined is accepted.
    resolve("app", undefined);
  });

  it("returns a plain string, never undefined or a layout type", () => {
    expectTypeOf<ReturnType<ResPathResolver>>().toEqualTypeOf<string>();
    expectTypeOf<undefined>().not.toExtend<ReturnType<ResPathResolver>>();
  });
});

describe("createResPathResolver", () => {
  it("takes a ResLayoutTypeResolver and returns a ResPathResolver", () => {
    expectTypeOf(createResPathResolver).parameter(0).toEqualTypeOf<ResLayoutEntryTypeResolver>();
    expectTypeOf(createResPathResolver).returns.toEqualTypeOf<ResPathResolver>();
  });

  it("accepts a compatible inline resolver function", () => {
    const inline = (ns: string): ResLayoutEntryType | undefined => (ns === "app" ? "gear" : undefined);
    const resolveResPath = createResPathResolver(inline);
    expectTypeOf(resolveResPath).toEqualTypeOf<ResPathResolver>();
  });

  it("rejects a function whose parameter type is incompatible with a namespace string", () => {
    // @ts-expect-error — number is not assignable to AnyNamespace (string)
    createResPathResolver((ns: number) => (ns === 0 ? "gear" : undefined));
  });

  it("rejects a function whose return type is not ResLayoutType | undefined", () => {
    // @ts-expect-error — "custom" is not a valid ResLayoutType
    createResPathResolver((_ns: string) => "custom" as const);
    // @ts-expect-error — returning a number violates the contract
    createResPathResolver((_ns: string) => 42);
  });
});

describe("end-to-end inference", () => {
  it("chains createResLayoutEntryTypeResolver into createResPathResolver without extra annotations", () => {
    const resolveResPath = createResPathResolver(
      createResLayoutEntryTypeResolver({
        app: "gear",
        "app/settings": "shell",
        "app/live": "dynamic-shell",
      })
    );
    expectTypeOf(resolveResPath).toEqualTypeOf<ResPathResolver>();

    const result = resolveResPath("app/settings", "en-US");
    expectTypeOf(result).toEqualTypeOf<string>();
  });
});
