import { describe, expectTypeOf, it } from "vitest";
import type { AnyResOrigin, ResFamily } from "../../src/core/res.js";
import type { AnyNamespace } from "../../src/core/res-atlas.js";
import { createResDescriptor, type ResDescriptor } from "../../src/core/res-descriptor.js";
import type { ResLayoutType } from "../../src/core/res-layout.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResDescriptor", () => {
  it("has exactly the declared set of keys — no implicit additions", () => {
    // Locks the public shape. Adding/removing a field would require updating
    // this test, making drift impossible to smuggle in silently.
    type Keys = keyof ResDescriptor;
    expectTypeOf<Keys>().toEqualTypeOf<
      "namespace" | "locale" | "family" | "isReactive" | "isVertex" | "deps" | "originType" | "origin"
    >();
  });

  it("marks every field as readonly (a writable twin is not assignable to the interface)", () => {
    // A fully writable mirror must not be equal to the readonly interface.
    // If any field lost its `readonly`, this equality would start holding.
    type Writable = {
      namespace: AnyNamespace;
      locale: AnyLocale | undefined;
      family: ResFamily;
      isReactive: boolean;
      isVertex: boolean;
      deps: string[];
      originType: "resource" | "res-matrix";
      origin: AnyResOrigin;
    };
    expectTypeOf<ResDescriptor>().not.toEqualTypeOf<Writable>();
    // Sanity: the writable twin is still structurally assignable to the
    // readonly interface (readonly is covariant in reads).
    expectTypeOf<Writable>().toExtend<ResDescriptor>();
  });

  it("types `namespace` as AnyNamespace (string), not a narrower literal", () => {
    expectTypeOf<ResDescriptor["namespace"]>().toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ResDescriptor["namespace"]>().toEqualTypeOf<string>();
  });

  it("types `locale` as the exact union AnyLocale | undefined (missing locales must be representable)", () => {
    expectTypeOf<ResDescriptor["locale"]>().toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<undefined>().toExtend<ResDescriptor["locale"]>();
    expectTypeOf<AnyLocale>().toExtend<ResDescriptor["locale"]>();
  });

  it("types `family` as ResFamily and intentionally excludes `dynamic-shell`", () => {
    // The descriptor is post-resolution: layout "dynamic-shell" collapses to
    // family "shell" at build time, so the family union never sees it.
    expectTypeOf<ResDescriptor["family"]>().toEqualTypeOf<ResFamily>();
    expectTypeOf<ResDescriptor["family"]>().toEqualTypeOf<"gear" | "shell">();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResDescriptor["family"]>();
  });

  it("types `isReactive` and `isVertex` as plain booleans (not literal true/false)", () => {
    expectTypeOf<ResDescriptor["isReactive"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ResDescriptor["isVertex"]>().toEqualTypeOf<boolean>();
  });

  it("types `deps` as a mutable string[] (the field is readonly, not the array)", () => {
    // Meaningful distinction: `readonly deps: string[]` means the slot can't
    // be reassigned, but the array itself is still mutable. A senior reader
    // should be able to rely on this.
    expectTypeOf<ResDescriptor["deps"]>().toEqualTypeOf<string[]>();
    expectTypeOf<ResDescriptor["deps"]>().not.toEqualTypeOf<readonly string[]>();
  });

  it("types `originType` as the closed union of the two canonical origin kinds", () => {
    expectTypeOf<ResDescriptor["originType"]>().toEqualTypeOf<"resource" | "res-matrix">();
    expectTypeOf<string>().not.toExtend<ResDescriptor["originType"]>();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResDescriptor["originType"]>();
  });

  it("types `origin` as the full AnyResOrigin union (package | raw resource)", () => {
    expectTypeOf<ResDescriptor["origin"]>().toEqualTypeOf<AnyResOrigin>();
  });
});

describe("createResDescriptor — signature", () => {
  it("takes (AnyResModule, AnyNamespace, AnyLocale | undefined, ResLayoutType) in this exact order", () => {
    expectTypeOf(createResDescriptor).parameter(0).toEqualTypeOf<AnyResModule>();
    expectTypeOf(createResDescriptor).parameter(1).toEqualTypeOf<AnyNamespace>();
    expectTypeOf(createResDescriptor).parameter(2).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf(createResDescriptor).parameter(3).toEqualTypeOf<ResLayoutType>();
  });

  it("has exactly four required positional parameters — no optional tail, no rest", () => {
    expectTypeOf<Parameters<typeof createResDescriptor>>().toEqualTypeOf<
      [module: AnyResModule, namespace: AnyNamespace, locale: AnyLocale | undefined, resourceLayoutType: ResLayoutType]
    >();
  });

  it("returns ResDescriptor (not widened to unknown, not narrowed to a specific origin-type branch)", () => {
    expectTypeOf(createResDescriptor).returns.toEqualTypeOf<ResDescriptor>();
  });

  it("does not refine the return type based on the layout literal passed in", () => {
    // Even when we pass the narrowest possible literal, the return stays
    // ResDescriptor — the function is intentionally non-generic to keep
    // call sites from having to unwrap discriminated variants.
    const module: AnyResModule = { r: { key: "val" } };
    const d1 = createResDescriptor(module, "ns", undefined, "gear");
    const d2 = createResDescriptor(module, "ns", "en-US", "shell");
    const d3 = createResDescriptor(module, "ns", "en-US", "dynamic-shell");
    expectTypeOf(d1).toEqualTypeOf<ResDescriptor>();
    expectTypeOf(d2).toEqualTypeOf<ResDescriptor>();
    expectTypeOf(d3).toEqualTypeOf<ResDescriptor>();
  });

  it("requires the locale argument to be passed explicitly (undefined is a value, not an omission)", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — locale is required even when undefined
    createResDescriptor(module, "ns", "gear");
    // Baseline: explicit undefined is accepted.
    createResDescriptor(module, "ns", undefined, "gear");
  });

  it("rejects a module that does not satisfy AnyResModule", () => {
    // @ts-expect-error — missing `r`
    createResDescriptor({}, "ns", undefined, "gear");
    // @ts-expect-error — `r` must be a resource origin, not a primitive
    createResDescriptor({ r: "nope" }, "ns", undefined, "gear");
    // @ts-expect-error — null is not an AnyResModule
    createResDescriptor(null, "ns", undefined, "gear");
  });

  it("rejects a namespace that is not a string", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — number is not AnyNamespace
    createResDescriptor(module, 42, undefined, "gear");
    // @ts-expect-error — symbol is not AnyNamespace
    createResDescriptor(module, Symbol("ns"), undefined, "gear");
  });

  it("rejects a locale that is neither string nor undefined", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — number is not a valid locale
    createResDescriptor(module, "ns", 0, "gear");
    // @ts-expect-error — null is explicitly excluded (only undefined is allowed for "no locale")
    createResDescriptor(module, "ns", null, "gear");
  });

  it("rejects a resourceLayoutType that is not a canonical layout literal", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — "custom" is not a ResLayoutType
    createResDescriptor(module, "ns", undefined, "custom");
    // @ts-expect-error — capitalized variant is not a ResLayoutType
    createResDescriptor(module, "ns", undefined, "Gear");
    // @ts-expect-error — arbitrary string is not assignable to the closed union
    createResDescriptor(module, "ns", undefined, "" as string);
  });

  it("accepts every canonical layout literal at the call site", () => {
    const module: AnyResModule = { r: {} };
    createResDescriptor(module, "ns", undefined, "gear");
    createResDescriptor(module, "ns", "en-US", "shell");
    createResDescriptor(module, "ns", "en-US", "dynamic-shell");
  });
});
