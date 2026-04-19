import { describe, expectTypeOf, it } from "vitest";
import type { AnyRes, AnyResOrigin } from "../../src/core/res.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { ResPathResolver } from "../../src/core/res-layout.js";
import {
  type AnyResModule,
  createResModuleLoader,
  type ResModuleLoader,
  type ResModuleLoaderFn,
  validateResModule,
} from "../../src/core/res-module.js";
import type { RMachineResolveError } from "../../src/errors/index.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("AnyResModule", () => {
  it("exposes an `r` field typed as AnyResOrigin", () => {
    expectTypeOf<AnyResModule["r"]>().toEqualTypeOf<AnyResOrigin>();
  });

  it("marks `r` as readonly (assignment is disallowed at the type level)", () => {
    // A mutable-`r` view is NOT assignable to AnyResModule's readonly shape in the
    // checker's variance rules when we compare the `Required<Writable>` form.
    type Writable = { r: AnyResOrigin };
    type ReadOnly = { readonly r: AnyResOrigin };
    expectTypeOf<AnyResModule>().toEqualTypeOf<ReadOnly>();
    // Sanity: the writable form is structurally assignable to AnyResModule
    // (readonly is covariant for reads), but AnyResModule itself is the readonly form.
    expectTypeOf<Writable>().toExtend<AnyResModule>();
  });

  it("accepts a plain AnyRes as `r`", () => {
    const resource: AnyRes = { key: "value" };
    const m: AnyResModule = { r: resource };
    expectTypeOf(m).toExtend<AnyResModule>();
    expectTypeOf(m.r).toEqualTypeOf<AnyResOrigin>();
  });

  it("rejects modules missing the `r` field", () => {
    // @ts-expect-error — `r` is required
    const m: AnyResModule = {};
    void m;
  });

  it("rejects modules whose `r` is not a resource origin (primitive)", () => {
    // @ts-expect-error — string is not assignable to AnyResOrigin
    const m: AnyResModule = { r: "not-a-resource" };
    void m;
  });

  it("rejects modules whose `r` is null", () => {
    // @ts-expect-error — null is not assignable to AnyResOrigin
    const m: AnyResModule = { r: null };
    void m;
  });
});

describe("ResModuleLoaderFn", () => {
  it("takes (path: string, namespace: AnyNamespace, locale: AnyLocale | undefined) and returns Promise<AnyResModule>", () => {
    expectTypeOf<ResModuleLoaderFn>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ResModuleLoaderFn>().parameter(1).toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ResModuleLoaderFn>().parameter(2).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<ResModuleLoaderFn>().returns.toEqualTypeOf<Promise<AnyResModule>>();
  });

  it("has an arity of exactly three required positional parameters", () => {
    expectTypeOf<Parameters<ResModuleLoaderFn>>().toEqualTypeOf<
      [path: string, namespace: AnyNamespace, locale: AnyLocale | undefined]
    >();
  });

  it("accepts a conforming inline function", () => {
    const fn: ResModuleLoaderFn = async (_path, _ns, _locale) => ({ r: { x: 1 } });
    expectTypeOf(fn).toEqualTypeOf<ResModuleLoaderFn>();
  });

  it("rejects a function whose return type is not a Promise<AnyResModule>", () => {
    // @ts-expect-error — returning a bare AnyResModule (not a promise) is invalid
    const bad: ResModuleLoaderFn = (_path, _ns, _locale) => ({ r: {} });
    void bad;
  });

  it("rejects a function whose resolved value lacks the `r` field", () => {
    // @ts-expect-error — resolved value must satisfy AnyResModule
    const bad: ResModuleLoaderFn = async (_path, _ns, _locale) => ({});
    void bad;
  });

  it("does not permit omitting the locale parameter at the call site", () => {
    const fn = (async () => ({ r: {} })) as ResModuleLoaderFn;
    // @ts-expect-error — locale is required, even when undefined
    void fn("path", "ns");
    // Baseline: explicit undefined is accepted.
    void fn("path", "ns", undefined);
    void fn("path", "ns", "en-US");
  });
});

describe("ResModuleLoader", () => {
  it("takes (namespace: AnyNamespace, locale: AnyLocale | undefined) and returns Promise<AnyResModule>", () => {
    expectTypeOf<ResModuleLoader>().parameter(0).toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ResModuleLoader>().parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<ResModuleLoader>().returns.toEqualTypeOf<Promise<AnyResModule>>();
  });

  it("has an arity of exactly two required positional parameters (the path has been curried away)", () => {
    expectTypeOf<Parameters<ResModuleLoader>>().toEqualTypeOf<
      [namespace: AnyNamespace, locale: AnyLocale | undefined]
    >();
  });

  it("is structurally distinct from ResModuleLoaderFn (different parameter lists)", () => {
    // A ResModuleLoaderFn takes three arguments; assigning it to a two-arg
    // ResModuleLoader slot is allowed (function parameter-count is bivariant for
    // fewer-arg callers), but they are NOT the same type.
    expectTypeOf<ResModuleLoader>().not.toEqualTypeOf<ResModuleLoaderFn>();
  });

  it("does not permit omitting the locale parameter at the call site", () => {
    const loader = (async () => ({ r: {} })) as unknown as ResModuleLoader;
    // @ts-expect-error — locale is required, even when undefined
    void loader("ns");
    void loader("ns", undefined);
    void loader("ns", "en-US");
  });
});

describe("createResModuleLoader", () => {
  it("takes (ResPathResolver, ResModuleLoaderFn) and returns ResModuleLoader", () => {
    expectTypeOf(createResModuleLoader).parameter(0).toEqualTypeOf<ResPathResolver>();
    expectTypeOf(createResModuleLoader).parameter(1).toEqualTypeOf<ResModuleLoaderFn>();
    expectTypeOf(createResModuleLoader).returns.toEqualTypeOf<ResModuleLoader>();
  });

  it("produces a ResModuleLoader whose signature matches the declared type exactly", () => {
    const resolveResPath: ResPathResolver = (ns) => ns;
    const loadResModuleFn: ResModuleLoaderFn = async () => ({ r: {} });
    const loader = createResModuleLoader(resolveResPath, loadResModuleFn);

    expectTypeOf(loader).toEqualTypeOf<ResModuleLoader>();
    expectTypeOf(loader).parameter(0).toEqualTypeOf<AnyNamespace>();
    expectTypeOf(loader).parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf(loader).returns.toEqualTypeOf<Promise<AnyResModule>>();
  });

  it("rejects a first argument that is not a ResPathResolver", () => {
    const loadResModuleFn: ResModuleLoaderFn = async () => ({ r: {} });
    // @ts-expect-error — number is not a ResPathResolver
    createResModuleLoader(42, loadResModuleFn);
    // @ts-expect-error — a resolver returning a number violates ResPathResolver's return type
    createResModuleLoader((_ns: string, _locale) => 0, loadResModuleFn);
  });

  it("rejects a second argument that is not a ResModuleLoaderFn", () => {
    const resolveResPath: ResPathResolver = (ns) => ns;
    // @ts-expect-error — synchronous (non-Promise) return is invalid
    createResModuleLoader(resolveResPath, (_path: string, _ns: string, _locale) => ({ r: {} }));
    // @ts-expect-error — resolved value is not an AnyResModule
    createResModuleLoader(resolveResPath, async (_path: string, _ns: string, _locale) => ({ nope: 1 }));
    // Note: passing a function with fewer parameters (e.g. `async (_p) => …`)
    // is accepted by TS's parameter-bivariance rules and is NOT a type error.
  });

  it("rejects a ResModuleLoaderFn whose path parameter is not a string", () => {
    const resolveResPath: ResPathResolver = (ns) => ns;
    // @ts-expect-error — path parameter must be string
    createResModuleLoader(resolveResPath, async (_path: number, _ns: string, _locale) => ({ r: {} }));
  });

  it("does not widen or narrow the loader's return type based on the concrete loadResModuleFn", () => {
    // Even if loadResModuleFn happens to resolve to a very specific shape, the
    // returned ResModuleLoader still advertises Promise<AnyResModule>. This guards
    // against accidental generic leakage that would force callers to re-widen.
    const resolveResPath: ResPathResolver = (ns) => ns;
    const specific = async (_p: string, _n: string, _l: AnyLocale | undefined) => ({
      r: { exact: "literal" as const },
    });
    const loader = createResModuleLoader(resolveResPath, specific);
    expectTypeOf(loader).toEqualTypeOf<ResModuleLoader>();
    expectTypeOf(loader).returns.toEqualTypeOf<Promise<AnyResModule>>();
  });
});

describe("end-to-end inference", () => {
  it("composes createResModuleLoader with a ResPathResolver without requiring extra annotations", async () => {
    const resolveResPath: ResPathResolver = (ns, locale) => (locale ? `${ns}/${locale}` : ns);
    const loadResModuleFn: ResModuleLoaderFn = async (_path, _ns, _locale) => ({ r: { hello: "world" } });

    const loader = createResModuleLoader(resolveResPath, loadResModuleFn);
    const result = loader("app", "en-US");

    expectTypeOf(result).toEqualTypeOf<Promise<AnyResModule>>();
    expectTypeOf(await result).toEqualTypeOf<AnyResModule>();
  });
});

describe("validateResModule — signature", () => {
  it("accepts `unknown` as input (no pre-narrowing required at the call site)", () => {
    // The whole point of a runtime validator is to accept genuinely untyped
    // input. A narrower parameter (e.g. `object`) would force callers to
    // pre-filter and defeat the purpose.
    expectTypeOf(validateResModule).parameter(0).toEqualTypeOf<unknown>();
  });

  it("has exactly one required positional parameter", () => {
    expectTypeOf<Parameters<typeof validateResModule>>().toEqualTypeOf<[input: unknown]>();
  });

  it("returns RMachineResolveError | null — null signals success, error signals failure", () => {
    // This mirrors validateCanonicalUnicodeLocaleId's convention: return the
    // error object instead of throwing, and use `null` to denote a valid
    // input. Callers do `const error = validate(x); if (error) …`.
    expectTypeOf(validateResModule).returns.toEqualTypeOf<RMachineResolveError | null>();
  });

  it("always includes null in the return type (so truthy-check on the return is meaningful)", () => {
    expectTypeOf<null>().toExtend<ReturnType<typeof validateResModule>>();
  });

  it("does NOT narrow the input parameter via a type predicate (the function returns, not asserts)", () => {
    // A type predicate would look like `(input: unknown): input is AnyResModule`
    // and an `asserts`-style would look like `asserts input is AnyResModule`.
    // validateResModule is NEITHER — it returns an error-or-null. This test
    // pins the difference so a future "clever" refactor can't silently turn
    // the signature into a type guard that would change the call-site
    // narrowing semantics.
    type ReturnT = ReturnType<typeof validateResModule>;
    expectTypeOf<ReturnT>().not.toEqualTypeOf<boolean>();
    expectTypeOf<ReturnT>().toEqualTypeOf<RMachineResolveError | null>();
  });

  it("does not narrow the argument in the `null` branch at the call site", () => {
    // Canonical usage: validate → if error, return — after that the CALLER
    // is responsible for casting. The validator itself is not a predicate,
    // so the input stays `unknown` even after the null check.
    const input: unknown = { r: {} };
    const error = validateResModule(input);
    if (error !== null) {
      expectTypeOf(error).toEqualTypeOf<RMachineResolveError>();
    } else {
      // `input` is still `unknown` here — the validator does not flow-narrow.
      expectTypeOf(input).toEqualTypeOf<unknown>();
    }
  });

  it("accepts any shape at the call site without complaining", () => {
    // All of these must type-check — validateResModule is the gatekeeper, so
    // TypeScript must not try to pre-filter the argument.
    validateResModule(null);
    validateResModule(undefined);
    validateResModule("string");
    validateResModule(42);
    validateResModule({});
    validateResModule({ r: null });
    validateResModule({ r: "nope" });
    validateResModule({ r: {} });
    const valid: AnyRes = { greeting: "hi" };
    validateResModule({ r: valid });
  });
});
