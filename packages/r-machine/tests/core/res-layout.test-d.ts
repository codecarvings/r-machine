import { describe, expectTypeOf, it } from "vitest";
import {
  type AnyResLayout,
  createResLayoutTypeResolver,
  createResPathResolver,
  type ResLayoutType,
  type ResLayoutTypeResolver,
  type ResPathResolver,
} from "../../src/core/res-layout.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResLayoutType", () => {
  it("is the exact union of the three canonical layout literals", () => {
    expectTypeOf<ResLayoutType>().toEqualTypeOf<"gear" | "shell" | "dynamic-shell">();
  });

  it("does not widen to string", () => {
    expectTypeOf<ResLayoutType>().not.toEqualTypeOf<string>();
    expectTypeOf<string>().not.toExtend<ResLayoutType>();
  });
});

describe("AnyResLayout", () => {
  it("indexes into ResLayoutType for any string key", () => {
    expectTypeOf<AnyResLayout[string]>().toEqualTypeOf<ResLayoutType>();
  });

  it("accepts the three canonical layout types as values", () => {
    expectTypeOf<"gear">().toExtend<ResLayoutType>();
    expectTypeOf<"shell">().toExtend<ResLayoutType>();
    expectTypeOf<"dynamic-shell">().toExtend<ResLayoutType>();
  });

  it("rejects unrelated string literals as values", () => {
    expectTypeOf<"not-a-layout">().not.toExtend<ResLayoutType>();
    expectTypeOf<"Gear">().not.toExtend<ResLayoutType>();
    expectTypeOf<string>().not.toExtend<ResLayoutType>();
  });

  it("does not accept non-string values", () => {
    expectTypeOf<number>().not.toExtend<ResLayoutType>();
    expectTypeOf<null>().not.toExtend<ResLayoutType>();
    expectTypeOf<undefined>().not.toExtend<ResLayoutType>();
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
    expectTypeOf<ResLayoutTypeResolver>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ResLayoutTypeResolver>().returns.toEqualTypeOf<ResLayoutType | undefined>();
  });

  it("return type always includes undefined (misses are representable)", () => {
    expectTypeOf<undefined>().toExtend<ReturnType<ResLayoutTypeResolver>>();
  });
});

describe("createResLayoutTypeResolver", () => {
  it("accepts an AnyResLayout and returns a ResLayoutTypeResolver", () => {
    expectTypeOf(createResLayoutTypeResolver).parameter(0).toEqualTypeOf<AnyResLayout>();
    expectTypeOf(createResLayoutTypeResolver).returns.toEqualTypeOf<ResLayoutTypeResolver>();
  });

  it("does not narrow the return type based on the literal input (runtime lookup is string-keyed)", () => {
    // The resolver is intentionally erased: even if we pass a narrowly-typed
    // literal, the returned function still accepts any namespace string and
    // still may return undefined. This guards against accidentally tightening
    // the API into a closed key set.
    const resolve = createResLayoutTypeResolver({ app: "gear" } as const);
    expectTypeOf(resolve).toEqualTypeOf<ResLayoutTypeResolver>();
    expectTypeOf(resolve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(resolve).returns.toEqualTypeOf<ResLayoutType | undefined>();
  });

  it("rejects layouts whose values are not layout types", () => {
    // @ts-expect-error — "not-a-layout" is not assignable to ResLayoutType
    createResLayoutTypeResolver({ app: "not-a-layout" });
    // @ts-expect-error — numbers are not layout types
    createResLayoutTypeResolver({ app: 42 });
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
    expectTypeOf(createResPathResolver).parameter(0).toEqualTypeOf<ResLayoutTypeResolver>();
    expectTypeOf(createResPathResolver).returns.toEqualTypeOf<ResPathResolver>();
  });

  it("accepts a compatible inline resolver function", () => {
    const inline = (ns: string): ResLayoutType | undefined => (ns === "app" ? "gear" : undefined);
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
  it("chains createResLayoutTypeResolver into createResPathResolver without extra annotations", () => {
    const resolveResPath = createResPathResolver(
      createResLayoutTypeResolver({
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
