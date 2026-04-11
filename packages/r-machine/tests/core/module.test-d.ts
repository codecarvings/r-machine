import { describe, expectTypeOf, it } from "vitest";
import {
  type AnyModule,
  createModuleLoader,
  type ModuleLoader,
  type ModuleLoaderFn,
  validateModule,
} from "../../src/core/module.js";
import type { PathResolver } from "../../src/core/res-layout.js";
import type { AnyResource, AnyResourceOrigin } from "../../src/core/resource.js";
import type { AnyNamespace } from "../../src/core/resource-atlas.js";
import type { RMachineResolveError } from "../../src/errors/index.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("AnyModule", () => {
  it("exposes an `r` field typed as AnyResourceOrigin", () => {
    expectTypeOf<AnyModule["r"]>().toEqualTypeOf<AnyResourceOrigin>();
  });

  it("marks `r` as readonly (assignment is disallowed at the type level)", () => {
    // A mutable-`r` view is NOT assignable to AnyModule's readonly shape in the
    // checker's variance rules when we compare the `Required<Writable>` form.
    type Writable = { r: AnyResourceOrigin };
    type ReadOnly = { readonly r: AnyResourceOrigin };
    expectTypeOf<AnyModule>().toEqualTypeOf<ReadOnly>();
    // Sanity: the writable form is structurally assignable to AnyModule
    // (readonly is covariant for reads), but AnyModule itself is the readonly form.
    expectTypeOf<Writable>().toExtend<AnyModule>();
  });

  it("accepts a plain AnyResource as `r`", () => {
    const resource: AnyResource = { key: "value" };
    const m: AnyModule = { r: resource };
    expectTypeOf(m).toExtend<AnyModule>();
    expectTypeOf(m.r).toEqualTypeOf<AnyResourceOrigin>();
  });

  it("rejects modules missing the `r` field", () => {
    // @ts-expect-error — `r` is required
    const m: AnyModule = {};
    void m;
  });

  it("rejects modules whose `r` is not a resource origin (primitive)", () => {
    // @ts-expect-error — string is not assignable to AnyResourceOrigin
    const m: AnyModule = { r: "not-a-resource" };
    void m;
  });

  it("rejects modules whose `r` is null", () => {
    // @ts-expect-error — null is not assignable to AnyResourceOrigin
    const m: AnyModule = { r: null };
    void m;
  });
});

describe("ModuleLoaderFn", () => {
  it("takes (path: string, namespace: AnyNamespace, locale: AnyLocale | undefined) and returns Promise<AnyModule>", () => {
    expectTypeOf<ModuleLoaderFn>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ModuleLoaderFn>().parameter(1).toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ModuleLoaderFn>().parameter(2).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<ModuleLoaderFn>().returns.toEqualTypeOf<Promise<AnyModule>>();
  });

  it("has an arity of exactly three required positional parameters", () => {
    expectTypeOf<Parameters<ModuleLoaderFn>>().toEqualTypeOf<
      [path: string, namespace: AnyNamespace, locale: AnyLocale | undefined]
    >();
  });

  it("accepts a conforming inline function", () => {
    const fn: ModuleLoaderFn = async (_path, _ns, _locale) => ({ r: { x: 1 } });
    expectTypeOf(fn).toEqualTypeOf<ModuleLoaderFn>();
  });

  it("rejects a function whose return type is not a Promise<AnyModule>", () => {
    // @ts-expect-error — returning a bare AnyModule (not a promise) is invalid
    const bad: ModuleLoaderFn = (_path, _ns, _locale) => ({ r: {} });
    void bad;
  });

  it("rejects a function whose resolved value lacks the `r` field", () => {
    // @ts-expect-error — resolved value must satisfy AnyModule
    const bad: ModuleLoaderFn = async (_path, _ns, _locale) => ({});
    void bad;
  });

  it("does not permit omitting the locale parameter at the call site", () => {
    const fn = (async () => ({ r: {} })) as ModuleLoaderFn;
    // @ts-expect-error — locale is required, even when undefined
    void fn("path", "ns");
    // Baseline: explicit undefined is accepted.
    void fn("path", "ns", undefined);
    void fn("path", "ns", "en-US");
  });
});

describe("ModuleLoader", () => {
  it("takes (namespace: AnyNamespace, locale: AnyLocale | undefined) and returns Promise<AnyModule>", () => {
    expectTypeOf<ModuleLoader>().parameter(0).toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ModuleLoader>().parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<ModuleLoader>().returns.toEqualTypeOf<Promise<AnyModule>>();
  });

  it("has an arity of exactly two required positional parameters (the path has been curried away)", () => {
    expectTypeOf<Parameters<ModuleLoader>>().toEqualTypeOf<[namespace: AnyNamespace, locale: AnyLocale | undefined]>();
  });

  it("is structurally distinct from ModuleLoaderFn (different parameter lists)", () => {
    // A ModuleLoaderFn takes three arguments; assigning it to a two-arg
    // ModuleLoader slot is allowed (function parameter-count is bivariant for
    // fewer-arg callers), but they are NOT the same type.
    expectTypeOf<ModuleLoader>().not.toEqualTypeOf<ModuleLoaderFn>();
  });

  it("does not permit omitting the locale parameter at the call site", () => {
    const loader = (async () => ({ r: {} })) as unknown as ModuleLoader;
    // @ts-expect-error — locale is required, even when undefined
    void loader("ns");
    void loader("ns", undefined);
    void loader("ns", "en-US");
  });
});

describe("createModuleLoader", () => {
  it("takes (PathResolver, ModuleLoaderFn) and returns ModuleLoader", () => {
    expectTypeOf(createModuleLoader).parameter(0).toEqualTypeOf<PathResolver>();
    expectTypeOf(createModuleLoader).parameter(1).toEqualTypeOf<ModuleLoaderFn>();
    expectTypeOf(createModuleLoader).returns.toEqualTypeOf<ModuleLoader>();
  });

  it("produces a ModuleLoader whose signature matches the declared type exactly", () => {
    const resolvePath: PathResolver = (ns) => ns;
    const loadModuleFn: ModuleLoaderFn = async () => ({ r: {} });
    const loader = createModuleLoader(resolvePath, loadModuleFn);

    expectTypeOf(loader).toEqualTypeOf<ModuleLoader>();
    expectTypeOf(loader).parameter(0).toEqualTypeOf<AnyNamespace>();
    expectTypeOf(loader).parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf(loader).returns.toEqualTypeOf<Promise<AnyModule>>();
  });

  it("rejects a first argument that is not a PathResolver", () => {
    const loadModuleFn: ModuleLoaderFn = async () => ({ r: {} });
    // @ts-expect-error — number is not a PathResolver
    createModuleLoader(42, loadModuleFn);
    // @ts-expect-error — a resolver returning a number violates PathResolver's return type
    createModuleLoader((_ns: string, _locale) => 0, loadModuleFn);
  });

  it("rejects a second argument that is not a ModuleLoaderFn", () => {
    const resolvePath: PathResolver = (ns) => ns;
    // @ts-expect-error — synchronous (non-Promise) return is invalid
    createModuleLoader(resolvePath, (_path: string, _ns: string, _locale) => ({ r: {} }));
    // @ts-expect-error — resolved value is not an AnyModule
    createModuleLoader(resolvePath, async (_path: string, _ns: string, _locale) => ({ nope: 1 }));
    // Note: passing a function with fewer parameters (e.g. `async (_p) => …`)
    // is accepted by TS's parameter-bivariance rules and is NOT a type error.
  });

  it("rejects a ModuleLoaderFn whose path parameter is not a string", () => {
    const resolvePath: PathResolver = (ns) => ns;
    // @ts-expect-error — path parameter must be string
    createModuleLoader(resolvePath, async (_path: number, _ns: string, _locale) => ({ r: {} }));
  });

  it("does not widen or narrow the loader's return type based on the concrete loadModuleFn", () => {
    // Even if loadModuleFn happens to resolve to a very specific shape, the
    // returned ModuleLoader still advertises Promise<AnyModule>. This guards
    // against accidental generic leakage that would force callers to re-widen.
    const resolvePath: PathResolver = (ns) => ns;
    const specific = async (_p: string, _n: string, _l: AnyLocale | undefined) => ({
      r: { exact: "literal" as const },
    });
    const loader = createModuleLoader(resolvePath, specific);
    expectTypeOf(loader).toEqualTypeOf<ModuleLoader>();
    expectTypeOf(loader).returns.toEqualTypeOf<Promise<AnyModule>>();
  });
});

describe("end-to-end inference", () => {
  it("composes createModuleLoader with a PathResolver without requiring extra annotations", async () => {
    const resolvePath: PathResolver = (ns, locale) => (locale ? `${ns}/${locale}` : ns);
    const loadModuleFn: ModuleLoaderFn = async (_path, _ns, _locale) => ({ r: { hello: "world" } });

    const loader = createModuleLoader(resolvePath, loadModuleFn);
    const result = loader("app", "en-US");

    expectTypeOf(result).toEqualTypeOf<Promise<AnyModule>>();
    expectTypeOf(await result).toEqualTypeOf<AnyModule>();
  });
});

describe("validateModule — signature", () => {
  it("accepts `unknown` as input (no pre-narrowing required at the call site)", () => {
    // The whole point of a runtime validator is to accept genuinely untyped
    // input. A narrower parameter (e.g. `object`) would force callers to
    // pre-filter and defeat the purpose.
    expectTypeOf(validateModule).parameter(0).toEqualTypeOf<unknown>();
  });

  it("has exactly one required positional parameter", () => {
    expectTypeOf<Parameters<typeof validateModule>>().toEqualTypeOf<[input: unknown]>();
  });

  it("returns RMachineResolveError | null — null signals success, error signals failure", () => {
    // This mirrors validateCanonicalUnicodeLocaleId's convention: return the
    // error object instead of throwing, and use `null` to denote a valid
    // input. Callers do `const error = validate(x); if (error) …`.
    expectTypeOf(validateModule).returns.toEqualTypeOf<RMachineResolveError | null>();
  });

  it("always includes null in the return type (so truthy-check on the return is meaningful)", () => {
    expectTypeOf<null>().toExtend<ReturnType<typeof validateModule>>();
  });

  it("does NOT narrow the input parameter via a type predicate (the function returns, not asserts)", () => {
    // A type predicate would look like `(input: unknown): input is AnyModule`
    // and an `asserts`-style would look like `asserts input is AnyModule`.
    // validateModule is NEITHER — it returns an error-or-null. This test
    // pins the difference so a future "clever" refactor can't silently turn
    // the signature into a type guard that would change the call-site
    // narrowing semantics.
    type ReturnT = ReturnType<typeof validateModule>;
    expectTypeOf<ReturnT>().not.toEqualTypeOf<boolean>();
    expectTypeOf<ReturnT>().toEqualTypeOf<RMachineResolveError | null>();
  });

  it("does not narrow the argument in the `null` branch at the call site", () => {
    // Canonical usage: validate → if error, return — after that the CALLER
    // is responsible for casting. The validator itself is not a predicate,
    // so the input stays `unknown` even after the null check.
    const input: unknown = { r: {} };
    const error = validateModule(input);
    if (error !== null) {
      expectTypeOf(error).toEqualTypeOf<RMachineResolveError>();
    } else {
      // `input` is still `unknown` here — the validator does not flow-narrow.
      expectTypeOf(input).toEqualTypeOf<unknown>();
    }
  });

  it("accepts any shape at the call site without complaining", () => {
    // All of these must type-check — validateModule is the gatekeeper, so
    // TypeScript must not try to pre-filter the argument.
    validateModule(null);
    validateModule(undefined);
    validateModule("string");
    validateModule(42);
    validateModule({});
    validateModule({ r: null });
    validateModule({ r: "nope" });
    validateModule({ r: {} });
    const valid: AnyResource = { greeting: "hi" };
    validateModule({ r: valid });
  });
});
