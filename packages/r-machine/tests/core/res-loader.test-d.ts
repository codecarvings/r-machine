import { describe, expectTypeOf, it } from "vitest";
import type { AnyNamespace, NamespaceParts } from "../../src/core/res-domain.js";
import {
  type AnyResourceLoader,
  createResourceLoader,
  type ResModuleLoaderFn,
  type ResModuleLoaderFnOptions,
} from "../../src/core/res-loader.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import type { AnyLocale } from "../../src/locale/index.js";

describe("ResModuleLoaderFn", () => {
  it("takes (path: string, options: ResModuleLoaderFnOptions) and returns Promise<AnyResModule>", () => {
    expectTypeOf<ResModuleLoaderFn>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ResModuleLoaderFn>().parameter(1).toEqualTypeOf<ResModuleLoaderFnOptions>();
    expectTypeOf<ResModuleLoaderFn>().returns.toEqualTypeOf<Promise<AnyResModule>>();
  });

  it("has arity of exactly two parameters", () => {
    expectTypeOf<Parameters<ResModuleLoaderFn>>().toEqualTypeOf<[path: string, options: ResModuleLoaderFnOptions]>();
  });

  it("accepts a conforming inline function", () => {
    const fn: ResModuleLoaderFn = async (_path, _options) => ({ r: { x: 1 } });
    expectTypeOf(fn).toEqualTypeOf<ResModuleLoaderFn>();
  });

  it("rejects a function whose return type is not a Promise<AnyResModule>", () => {
    // @ts-expect-error — returning a bare AnyResModule (not a promise) is invalid
    const bad: ResModuleLoaderFn = (_path, _options) => ({ r: {} });
    void bad;
  });

  it("rejects a function whose resolved value lacks the `r` field", () => {
    // @ts-expect-error — resolved value must satisfy AnyResModule
    const bad: ResModuleLoaderFn = async (_path, _options) => ({});
    void bad;
  });
});

describe("ResModuleLoaderFnOptions", () => {
  it("exposes the option fields", () => {
    expectTypeOf<ResModuleLoaderFnOptions["namespace"]>().toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ResModuleLoaderFnOptions["namespaceParts"]>().toEqualTypeOf<NamespaceParts>();
    expectTypeOf<ResModuleLoaderFnOptions["pathParts"]>().toEqualTypeOf<string[]>();
    expectTypeOf<ResModuleLoaderFnOptions["locale"]>().toEqualTypeOf<AnyLocale | undefined>();
  });
});

describe("ResourceLoader", () => {
  it("exposes register and load", () => {
    expectTypeOf<AnyResourceLoader>().toHaveProperty("register");
    expectTypeOf<AnyResourceLoader["load"]>().toEqualTypeOf<ResModuleLoaderFn>();
  });

  it("register's second parameter is a ResModuleLoaderFn", () => {
    expectTypeOf<AnyResourceLoader["register"]>().parameter(1).toEqualTypeOf<ResModuleLoaderFn>();
  });

  it("constrains register() prefixes to the layout's prefixes (or '*')", () => {
    const loader = createResourceLoader<{ "shell/": "shell"; "base/": "gear:base" }>();
    loader.register(["shell/", "base/"], async () => ({ r: {} }) as AnyResModule);
    loader.register(["*"], async () => ({ r: {} }) as AnyResModule);
    // @ts-expect-error — "inner/" is not a declared layout prefix
    loader.register(["inner/"], async () => ({ r: {} }) as AnyResModule);
  });
});

describe("createResourceLoader", () => {
  it("returns a ResourceLoader whose load is a ResModuleLoaderFn", () => {
    expectTypeOf(createResourceLoader).toBeFunction();
    const loader = createResourceLoader<{ "shell/": "shell" }>();
    expectTypeOf(loader.load).toEqualTypeOf<ResModuleLoaderFn>();
  });
});
