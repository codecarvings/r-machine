import { describe, expectTypeOf, it } from "vitest";
import {
  type AnyResourceLayout,
  createPathResolver,
  createResourceLayoutResolver,
  type PathResolver,
  type ResourceLayoutResolver,
  type ResourceLayoutType,
} from "../../src/core/resource-layout.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResourceLayoutType", () => {
  it("is the exact union of the three canonical layout literals", () => {
    expectTypeOf<ResourceLayoutType>().toEqualTypeOf<"gear" | "shell" | "dynamic-shell">();
  });

  it("does not widen to string", () => {
    expectTypeOf<ResourceLayoutType>().not.toEqualTypeOf<string>();
    expectTypeOf<string>().not.toExtend<ResourceLayoutType>();
  });
});

describe("AnyResourceLayout", () => {
  it("indexes into ResourceLayoutType for any string key", () => {
    expectTypeOf<AnyResourceLayout[string]>().toEqualTypeOf<ResourceLayoutType>();
  });

  it("accepts the three canonical layout types as values", () => {
    expectTypeOf<"gear">().toExtend<ResourceLayoutType>();
    expectTypeOf<"shell">().toExtend<ResourceLayoutType>();
    expectTypeOf<"dynamic-shell">().toExtend<ResourceLayoutType>();
  });

  it("rejects unrelated string literals as values", () => {
    expectTypeOf<"not-a-layout">().not.toExtend<ResourceLayoutType>();
    expectTypeOf<"Gear">().not.toExtend<ResourceLayoutType>();
    expectTypeOf<string>().not.toExtend<ResourceLayoutType>();
  });

  it("does not accept non-string values", () => {
    expectTypeOf<number>().not.toExtend<ResourceLayoutType>();
    expectTypeOf<null>().not.toExtend<ResourceLayoutType>();
    expectTypeOf<undefined>().not.toExtend<ResourceLayoutType>();
  });

  it("accepts an object literal whose values are layout types", () => {
    const layout = {
      app: "gear",
      "app/settings": "shell",
      "app/live": "dynamic-shell",
    } as const satisfies AnyResourceLayout;
    expectTypeOf(layout).toExtend<AnyResourceLayout>();
  });
});

describe("ResourceLayoutResolver", () => {
  it("takes a namespace string and returns a layout type or undefined", () => {
    expectTypeOf<ResourceLayoutResolver>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ResourceLayoutResolver>().returns.toEqualTypeOf<ResourceLayoutType | undefined>();
  });

  it("return type always includes undefined (misses are representable)", () => {
    expectTypeOf<undefined>().toExtend<ReturnType<ResourceLayoutResolver>>();
  });
});

describe("createResourceLayoutResolver", () => {
  it("accepts an AnyResourceLayout and returns a ResourceLayoutResolver", () => {
    expectTypeOf(createResourceLayoutResolver).parameter(0).toEqualTypeOf<AnyResourceLayout>();
    expectTypeOf(createResourceLayoutResolver).returns.toEqualTypeOf<ResourceLayoutResolver>();
  });

  it("does not narrow the return type based on the literal input (runtime lookup is string-keyed)", () => {
    // The resolver is intentionally erased: even if we pass a narrowly-typed
    // literal, the returned function still accepts any namespace string and
    // still may return undefined. This guards against accidentally tightening
    // the API into a closed key set.
    const resolve = createResourceLayoutResolver({ app: "gear" } as const);
    expectTypeOf(resolve).toEqualTypeOf<ResourceLayoutResolver>();
    expectTypeOf(resolve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(resolve).returns.toEqualTypeOf<ResourceLayoutType | undefined>();
  });

  it("rejects layouts whose values are not layout types", () => {
    // @ts-expect-error — "not-a-layout" is not assignable to ResourceLayoutType
    createResourceLayoutResolver({ app: "not-a-layout" });
    // @ts-expect-error — numbers are not layout types
    createResourceLayoutResolver({ app: 42 });
  });
});

describe("PathResolver", () => {
  it("takes (namespace, locale | undefined) and returns a string", () => {
    expectTypeOf<PathResolver>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<PathResolver>().parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<PathResolver>().returns.toEqualTypeOf<string>();
  });

  it("does not allow omitting the locale argument (undefined must be passed explicitly)", () => {
    const resolve: PathResolver = (ns) => ns;
    // @ts-expect-error — locale parameter is required even when undefined
    resolve("app");
    // Baseline: explicit undefined is accepted.
    resolve("app", undefined);
  });

  it("returns a plain string, never undefined or a layout type", () => {
    expectTypeOf<ReturnType<PathResolver>>().toEqualTypeOf<string>();
    expectTypeOf<undefined>().not.toExtend<ReturnType<PathResolver>>();
  });
});

describe("createPathResolver", () => {
  it("takes a ResourceLayoutResolver and returns a PathResolver", () => {
    expectTypeOf(createPathResolver).parameter(0).toEqualTypeOf<ResourceLayoutResolver>();
    expectTypeOf(createPathResolver).returns.toEqualTypeOf<PathResolver>();
  });

  it("accepts a compatible inline resolver function", () => {
    const inline = (ns: string): ResourceLayoutType | undefined => (ns === "app" ? "gear" : undefined);
    const resolvePath = createPathResolver(inline);
    expectTypeOf(resolvePath).toEqualTypeOf<PathResolver>();
  });

  it("rejects a function whose parameter type is incompatible with a namespace string", () => {
    // @ts-expect-error — number is not assignable to AnyNamespace (string)
    createPathResolver((ns: number) => (ns === 0 ? "gear" : undefined));
  });

  it("rejects a function whose return type is not ResourceLayoutType | undefined", () => {
    // @ts-expect-error — "custom" is not a valid ResourceLayoutType
    createPathResolver((_ns: string) => "custom" as const);
    // @ts-expect-error — returning a number violates the contract
    createPathResolver((_ns: string) => 42);
  });
});

describe("end-to-end inference", () => {
  it("chains createResourceLayoutResolver into createPathResolver without extra annotations", () => {
    const resolvePath = createPathResolver(
      createResourceLayoutResolver({
        app: "gear",
        "app/settings": "shell",
        "app/live": "dynamic-shell",
      })
    );
    expectTypeOf(resolvePath).toEqualTypeOf<PathResolver>();

    const result = resolvePath("app/settings", "en-US");
    expectTypeOf(result).toEqualTypeOf<string>();
  });
});
