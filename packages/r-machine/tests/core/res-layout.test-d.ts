import { describe, expectTypeOf, it } from "vitest";
import {
  type AnyResLayout,
  createResLayoutEntryTypeResolver,
  type ResLayoutEntryType,
  type ResLayoutEntryTypeResolver,
  type ResPathResolver,
  resolveResPath,
} from "../../src/core/res-layout.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResLayoutEntryType", () => {
  it("is the exact union of the four canonical layout literals", () => {
    expectTypeOf<ResLayoutEntryType>().toEqualTypeOf<"gear" | "gear:vertex" | "shell" | "shell:mono">();
  });

  it("does not widen to string", () => {
    expectTypeOf<ResLayoutEntryType>().not.toEqualTypeOf<string>();
    expectTypeOf<string>().not.toExtend<ResLayoutEntryType>();
  });
});

describe("AnyResLayout", () => {
  it("indexes into ResLayoutEntryType for any trailing-slash key", () => {
    expectTypeOf<AnyResLayout[`${string}/`]>().toEqualTypeOf<ResLayoutEntryType>();
  });

  it("accepts the four canonical layout types as values", () => {
    expectTypeOf<"gear">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"gear:vertex">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"shell">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"shell:mono">().toExtend<ResLayoutEntryType>();
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

  it("accepts an object literal whose keys end with '/' and values are layout types", () => {
    const layout = {
      "app/": "gear",
      "app/settings/": "shell",
      "app/live/": "shell:mono",
    } as const satisfies AnyResLayout;
    expectTypeOf(layout).toExtend<AnyResLayout>();
  });

  it("rejects an object literal whose keys do not end with '/'", () => {
    // @ts-expect-error — "app" does not end with "/" so it fails the index-signature constraint
    const _bad = { app: "gear" } as const satisfies AnyResLayout;
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
    const resolve = createResLayoutEntryTypeResolver({ "app/": "gear" } as const);
    expectTypeOf(resolve).toEqualTypeOf<ResLayoutEntryTypeResolver>();
    expectTypeOf(resolve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(resolve).returns.toEqualTypeOf<ResLayoutEntryType | undefined>();
  });

  it("rejects layouts whose values are not layout types", () => {
    // @ts-expect-error — "not-a-layout" is not assignable to ResLayoutType
    createResLayoutEntryTypeResolver({ "app/": "not-a-layout" });
    // @ts-expect-error — numbers are not layout types
    createResLayoutEntryTypeResolver({ "app/": 42 });
  });

  it("rejects layouts whose keys do not end with '/'", () => {
    // @ts-expect-error — "app" does not end with "/" so it fails the index-signature constraint
    createResLayoutEntryTypeResolver({ app: "gear" });
  });
});

describe("ResPathResolver", () => {
  it("takes (namespace, locale | undefined, layoutEntryType) and returns a string", () => {
    expectTypeOf<ResPathResolver>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ResPathResolver>().parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<ResPathResolver>().parameter(2).toEqualTypeOf<ResLayoutEntryType>();
    expectTypeOf<ResPathResolver>().returns.toEqualTypeOf<string>();
  });

  it("has an arity of exactly three required positional parameters", () => {
    expectTypeOf<Parameters<ResPathResolver>>().toEqualTypeOf<
      [namespace: string, locale: AnyLocale | undefined, layoutEntryType: ResLayoutEntryType]
    >();
  });

  it("does not allow omitting the locale argument (undefined must be passed explicitly)", () => {
    const resolve: ResPathResolver = (ns) => ns;
    // @ts-expect-error — locale parameter is required even when undefined
    resolve("app", "gear");
    // @ts-expect-error — layoutEntryType parameter is required
    resolve("app", undefined);
    // Baseline: all three arguments explicit is accepted.
    resolve("app", undefined, "gear");
  });

  it("returns a plain string, never undefined or a layout type", () => {
    expectTypeOf<ReturnType<ResPathResolver>>().toEqualTypeOf<string>();
    expectTypeOf<undefined>().not.toExtend<ReturnType<ResPathResolver>>();
  });
});

describe("resolveResPath", () => {
  it("matches the ResPathResolver signature exactly", () => {
    expectTypeOf(resolveResPath).toEqualTypeOf<ResPathResolver>();
  });

  it("takes (namespace, locale | undefined, layoutEntryType) and returns a string", () => {
    expectTypeOf(resolveResPath).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(resolveResPath).parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf(resolveResPath).parameter(2).toEqualTypeOf<ResLayoutEntryType>();
    expectTypeOf(resolveResPath).returns.toEqualTypeOf<string>();
  });

  it("rejects a layoutEntryType that is not a canonical literal", () => {
    // @ts-expect-error — "custom" is not a valid ResLayoutEntryType
    resolveResPath("app", undefined, "custom");
    // @ts-expect-error — numbers are not layout types
    resolveResPath("app", undefined, 42);
  });

  it("does not permit omitting any parameter at the call site", () => {
    // @ts-expect-error — layoutEntryType is required
    resolveResPath("app", undefined);
    // @ts-expect-error — locale is required (even when undefined)
    resolveResPath("app");
    // Baseline: all three explicit is accepted.
    resolveResPath("app", undefined, "gear");
  });
});

describe("end-to-end inference", () => {
  it("composes createResLayoutEntryTypeResolver with resolveResPath without extra annotations", () => {
    const resolveLayoutType = createResLayoutEntryTypeResolver({
      "app/": "gear",
      "app/settings/": "shell",
      "app/live/": "shell:mono",
    });

    const layoutType = resolveLayoutType("app/settings");
    expectTypeOf(layoutType).toEqualTypeOf<ResLayoutEntryType | undefined>();

    // At the call site the caller must narrow before passing to resolveResPath.
    if (layoutType !== undefined) {
      const result = resolveResPath("app/settings", "en-US", layoutType);
      expectTypeOf(result).toEqualTypeOf<string>();
    }
  });
});
