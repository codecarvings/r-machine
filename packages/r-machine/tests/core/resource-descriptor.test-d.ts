import { describe, expectTypeOf, it } from "vitest";
import type { AnyModule } from "../../src/core/module.js";
import type { AnyResourceOrigin, ResourceFamily } from "../../src/core/resource.js";
import type { AnyNamespace } from "../../src/core/resource-atlas.js";
import { createResourceDescriptor, type ResourceDescriptor } from "../../src/core/resource-descriptor.js";
import type { ResourceLayoutType } from "../../src/core/resource-layout.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResourceDescriptor", () => {
  it("has exactly the declared set of keys — no implicit additions", () => {
    // Locks the public shape. Adding/removing a field would require updating
    // this test, making drift impossible to smuggle in silently.
    type Keys = keyof ResourceDescriptor;
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
      family: ResourceFamily;
      isReactive: boolean;
      isVertex: boolean;
      deps: string[];
      originType: "resource" | "res-matrix";
      origin: AnyResourceOrigin;
    };
    expectTypeOf<ResourceDescriptor>().not.toEqualTypeOf<Writable>();
    // Sanity: the writable twin is still structurally assignable to the
    // readonly interface (readonly is covariant in reads).
    expectTypeOf<Writable>().toExtend<ResourceDescriptor>();
  });

  it("types `namespace` as AnyNamespace (string), not a narrower literal", () => {
    expectTypeOf<ResourceDescriptor["namespace"]>().toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ResourceDescriptor["namespace"]>().toEqualTypeOf<string>();
  });

  it("types `locale` as the exact union AnyLocale | undefined (missing locales must be representable)", () => {
    expectTypeOf<ResourceDescriptor["locale"]>().toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<undefined>().toExtend<ResourceDescriptor["locale"]>();
    expectTypeOf<AnyLocale>().toExtend<ResourceDescriptor["locale"]>();
  });

  it("types `family` as ResourceFamily and intentionally excludes `dynamic-shell`", () => {
    // The descriptor is post-resolution: layout "dynamic-shell" collapses to
    // family "shell" at build time, so the family union never sees it.
    expectTypeOf<ResourceDescriptor["family"]>().toEqualTypeOf<ResourceFamily>();
    expectTypeOf<ResourceDescriptor["family"]>().toEqualTypeOf<"gear" | "shell">();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResourceDescriptor["family"]>();
  });

  it("types `isReactive` and `isVertex` as plain booleans (not literal true/false)", () => {
    expectTypeOf<ResourceDescriptor["isReactive"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ResourceDescriptor["isVertex"]>().toEqualTypeOf<boolean>();
  });

  it("types `deps` as a mutable string[] (the field is readonly, not the array)", () => {
    // Meaningful distinction: `readonly deps: string[]` means the slot can't
    // be reassigned, but the array itself is still mutable. A senior reader
    // should be able to rely on this.
    expectTypeOf<ResourceDescriptor["deps"]>().toEqualTypeOf<string[]>();
    expectTypeOf<ResourceDescriptor["deps"]>().not.toEqualTypeOf<readonly string[]>();
  });

  it("types `originType` as the closed union of the two canonical origin kinds", () => {
    expectTypeOf<ResourceDescriptor["originType"]>().toEqualTypeOf<"resource" | "res-matrix">();
    expectTypeOf<string>().not.toExtend<ResourceDescriptor["originType"]>();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResourceDescriptor["originType"]>();
  });

  it("types `origin` as the full AnyResourceOrigin union (package | raw resource)", () => {
    expectTypeOf<ResourceDescriptor["origin"]>().toEqualTypeOf<AnyResourceOrigin>();
  });
});

describe("createResourceDescriptor — signature", () => {
  it("takes (AnyModule, AnyNamespace, AnyLocale | undefined, ResourceLayoutType) in this exact order", () => {
    expectTypeOf(createResourceDescriptor).parameter(0).toEqualTypeOf<AnyModule>();
    expectTypeOf(createResourceDescriptor).parameter(1).toEqualTypeOf<AnyNamespace>();
    expectTypeOf(createResourceDescriptor).parameter(2).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf(createResourceDescriptor).parameter(3).toEqualTypeOf<ResourceLayoutType>();
  });

  it("has exactly four required positional parameters — no optional tail, no rest", () => {
    expectTypeOf<Parameters<typeof createResourceDescriptor>>().toEqualTypeOf<
      [
        module: AnyModule,
        namespace: AnyNamespace,
        locale: AnyLocale | undefined,
        resourceLayoutType: ResourceLayoutType,
      ]
    >();
  });

  it("returns ResourceDescriptor (not widened to unknown, not narrowed to a specific origin-type branch)", () => {
    expectTypeOf(createResourceDescriptor).returns.toEqualTypeOf<ResourceDescriptor>();
  });

  it("does not refine the return type based on the layout literal passed in", () => {
    // Even when we pass the narrowest possible literal, the return stays
    // ResourceDescriptor — the function is intentionally non-generic to keep
    // call sites from having to unwrap discriminated variants.
    const module: AnyModule = { r: { key: "val" } };
    const d1 = createResourceDescriptor(module, "ns", undefined, "gear");
    const d2 = createResourceDescriptor(module, "ns", "en-US", "shell");
    const d3 = createResourceDescriptor(module, "ns", "en-US", "dynamic-shell");
    expectTypeOf(d1).toEqualTypeOf<ResourceDescriptor>();
    expectTypeOf(d2).toEqualTypeOf<ResourceDescriptor>();
    expectTypeOf(d3).toEqualTypeOf<ResourceDescriptor>();
  });

  it("requires the locale argument to be passed explicitly (undefined is a value, not an omission)", () => {
    const module: AnyModule = { r: {} };
    // @ts-expect-error — locale is required even when undefined
    createResourceDescriptor(module, "ns", "gear");
    // Baseline: explicit undefined is accepted.
    createResourceDescriptor(module, "ns", undefined, "gear");
  });

  it("rejects a module that does not satisfy AnyModule", () => {
    // @ts-expect-error — missing `r`
    createResourceDescriptor({}, "ns", undefined, "gear");
    // @ts-expect-error — `r` must be a resource origin, not a primitive
    createResourceDescriptor({ r: "nope" }, "ns", undefined, "gear");
    // @ts-expect-error — null is not an AnyModule
    createResourceDescriptor(null, "ns", undefined, "gear");
  });

  it("rejects a namespace that is not a string", () => {
    const module: AnyModule = { r: {} };
    // @ts-expect-error — number is not AnyNamespace
    createResourceDescriptor(module, 42, undefined, "gear");
    // @ts-expect-error — symbol is not AnyNamespace
    createResourceDescriptor(module, Symbol("ns"), undefined, "gear");
  });

  it("rejects a locale that is neither string nor undefined", () => {
    const module: AnyModule = { r: {} };
    // @ts-expect-error — number is not a valid locale
    createResourceDescriptor(module, "ns", 0, "gear");
    // @ts-expect-error — null is explicitly excluded (only undefined is allowed for "no locale")
    createResourceDescriptor(module, "ns", null, "gear");
  });

  it("rejects a resourceLayoutType that is not a canonical layout literal", () => {
    const module: AnyModule = { r: {} };
    // @ts-expect-error — "custom" is not a ResourceLayoutType
    createResourceDescriptor(module, "ns", undefined, "custom");
    // @ts-expect-error — capitalized variant is not a ResourceLayoutType
    createResourceDescriptor(module, "ns", undefined, "Gear");
    // @ts-expect-error — arbitrary string is not assignable to the closed union
    createResourceDescriptor(module, "ns", undefined, "" as string);
  });

  it("accepts every canonical layout literal at the call site", () => {
    const module: AnyModule = { r: {} };
    createResourceDescriptor(module, "ns", undefined, "gear");
    createResourceDescriptor(module, "ns", "en-US", "shell");
    createResourceDescriptor(module, "ns", "en-US", "dynamic-shell");
  });
});
