import { describe, expectTypeOf, it } from "vitest";
import type { AnyPlugHead } from "../../src/core/plug.js";
import type { AnyResOrigin, ResFamily } from "../../src/core/res.js";
import { createResBlueprint, type ResBlueprint } from "../../src/core/res-blueprint.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { ResLayoutEntryType } from "../../src/core/res-layout.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResBlueprint", () => {
  it("has exactly the declared set of keys — no implicit additions", () => {
    // Locks the public shape. Adding/removing a field would require updating
    // this test, making drift impossible to smuggle in silently.
    type Keys = keyof ResBlueprint;
    expectTypeOf<Keys>().toEqualTypeOf<
      "namespace" | "locale" | "family" | "isReactive" | "isVertex" | "plugHead" | "originType" | "origin"
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
      plugHead: AnyPlugHead | undefined;
      originType: "raw" | "res-matrix";
      origin: AnyResOrigin;
    };
    expectTypeOf<ResBlueprint>().not.toEqualTypeOf<Writable>();
    // Sanity: the writable twin is still structurally assignable to the
    // readonly interface (readonly is covariant in reads).
    expectTypeOf<Writable>().toExtend<ResBlueprint>();
  });

  it("types `namespace` as AnyNamespace (string), not a narrower literal", () => {
    expectTypeOf<ResBlueprint["namespace"]>().toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ResBlueprint["namespace"]>().toEqualTypeOf<string>();
  });

  it("types `locale` as the exact union AnyLocale | undefined (missing locales must be representable)", () => {
    expectTypeOf<ResBlueprint["locale"]>().toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<undefined>().toExtend<ResBlueprint["locale"]>();
    expectTypeOf<AnyLocale>().toExtend<ResBlueprint["locale"]>();
  });

  it("types `family` as ResFamily and intentionally excludes `shell:mono`", () => {
    // The data is post-resolution: layout "shell:mono" collapses to
    // family "shell" at build time, so the family union never sees it.
    expectTypeOf<ResBlueprint["family"]>().toEqualTypeOf<ResFamily>();
    expectTypeOf<ResBlueprint["family"]>().toEqualTypeOf<"gear" | "shell">();
    expectTypeOf<"shell:mono">().not.toExtend<ResBlueprint["family"]>();
  });

  it("types `isReactive` and `isVertex` as plain booleans (not literal true/false)", () => {
    expectTypeOf<ResBlueprint["isReactive"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ResBlueprint["isVertex"]>().toEqualTypeOf<boolean>();
  });

  it("types `plugHead` as AnyPlugHead | undefined (raw resources have no plug)", () => {
    // Matrix origins carry the plug data extracted from the plug at blueprint
    // build time; raw resources have no plug, so `undefined` must be a
    // representable absence, not a sentinel empty object.
    expectTypeOf<ResBlueprint["plugHead"]>().toEqualTypeOf<AnyPlugHead | undefined>();
    expectTypeOf<undefined>().toExtend<ResBlueprint["plugHead"]>();
    expectTypeOf<AnyPlugHead>().toExtend<ResBlueprint["plugHead"]>();
  });

  it("types `originType` as the closed union of the two canonical origin kinds", () => {
    expectTypeOf<ResBlueprint["originType"]>().toEqualTypeOf<"raw" | "res-matrix">();
    expectTypeOf<string>().not.toExtend<ResBlueprint["originType"]>();
    expectTypeOf<"shell:mono">().not.toExtend<ResBlueprint["originType"]>();
  });

  it("types `origin` as the full AnyResOrigin union (package | raw resource)", () => {
    expectTypeOf<ResBlueprint["origin"]>().toEqualTypeOf<AnyResOrigin>();
  });
});

describe("createResBlueprint — signature", () => {
  it("takes (AnyResModule, AnyNamespace, AnyLocale | undefined, ResLayoutType) in this exact order", () => {
    expectTypeOf(createResBlueprint).parameter(0).toEqualTypeOf<AnyResModule>();
    expectTypeOf(createResBlueprint).parameter(1).toEqualTypeOf<AnyNamespace>();
    expectTypeOf(createResBlueprint).parameter(2).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf(createResBlueprint).parameter(3).toEqualTypeOf<ResLayoutEntryType>();
  });

  it("has exactly four required positional parameters — no optional tail, no rest", () => {
    expectTypeOf<Parameters<typeof createResBlueprint>>().toEqualTypeOf<
      [
        module: AnyResModule,
        namespace: AnyNamespace,
        locale: AnyLocale | undefined,
        resLayoutEntryType: ResLayoutEntryType,
      ]
    >();
  });

  it("returns ResBlueprint (not widened to unknown, not narrowed to a specific origin-type branch)", () => {
    expectTypeOf(createResBlueprint).returns.toEqualTypeOf<ResBlueprint>();
  });

  it("does not refine the return type based on the layout literal passed in", () => {
    // Even when we pass the narrowest possible literal, the return stays
    // ResBlueprint — the function is intentionally non-generic to keep
    // call sites from having to unwrap discriminated variants.
    const module: AnyResModule = { r: { key: "val" } };
    const d1 = createResBlueprint(module, "ns", undefined, "gear");
    const d2 = createResBlueprint(module, "ns", "en-US", "shell");
    const d3 = createResBlueprint(module, "ns", "en-US", "shell:mono");
    expectTypeOf(d1).toEqualTypeOf<ResBlueprint>();
    expectTypeOf(d2).toEqualTypeOf<ResBlueprint>();
    expectTypeOf(d3).toEqualTypeOf<ResBlueprint>();
  });

  it("requires the locale argument to be passed explicitly (undefined is a value, not an omission)", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — locale is required even when undefined
    createResBlueprint(module, "ns", "gear");
    // Baseline: explicit undefined is accepted.
    createResBlueprint(module, "ns", undefined, "gear");
  });

  it("rejects a module that does not satisfy AnyResModule", () => {
    // @ts-expect-error — missing `r`
    createResBlueprint({}, "ns", undefined, "gear");
    // @ts-expect-error — `r` must be a resource origin, not a primitive
    createResBlueprint({ r: "nope" }, "ns", undefined, "gear");
    // @ts-expect-error — null is not an AnyResModule
    createResBlueprint(null, "ns", undefined, "gear");
  });

  it("rejects a namespace that is not a string", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — number is not AnyNamespace
    createResBlueprint(module, 42, undefined, "gear");
    // @ts-expect-error — symbol is not AnyNamespace
    createResBlueprint(module, Symbol("ns"), undefined, "gear");
  });

  it("rejects a locale that is neither string nor undefined", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — number is not a valid locale
    createResBlueprint(module, "ns", 0, "gear");
    // @ts-expect-error — null is explicitly excluded (only undefined is allowed for "no locale")
    createResBlueprint(module, "ns", null, "gear");
  });

  it("rejects a resourceLayoutType that is not a canonical layout literal", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — "custom" is not a ResLayoutType
    createResBlueprint(module, "ns", undefined, "custom");
    // @ts-expect-error — capitalized variant is not a ResLayoutType
    createResBlueprint(module, "ns", undefined, "Gear");
    // @ts-expect-error — arbitrary string is not assignable to the closed union
    createResBlueprint(module, "ns", undefined, "" as string);
  });

  it("accepts every canonical layout literal at the call site", () => {
    const module: AnyResModule = { r: {} };
    createResBlueprint(module, "ns", undefined, "gear");
    createResBlueprint(module, "ns", "en-US", "shell");
    createResBlueprint(module, "ns", "en-US", "shell:mono");
  });
});
