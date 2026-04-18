import { describe, expectTypeOf, it } from "vitest";
import type { AnyPlugHead } from "../../src/core/plug.js";
import type { AnyResOrigin, ResFamily } from "../../src/core/res.js";
import type { AnyNamespace } from "../../src/core/res-atlas.js";
import type { ResLayoutEntryType } from "../../src/core/res-layout.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import { createResPod, type ResPod } from "../../src/core/res-pod.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResPod", () => {
  it("has exactly the declared set of keys — no implicit additions", () => {
    // Locks the public shape. Adding/removing a field would require updating
    // this test, making drift impossible to smuggle in silently.
    type Keys = keyof ResPod;
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
    expectTypeOf<ResPod>().not.toEqualTypeOf<Writable>();
    // Sanity: the writable twin is still structurally assignable to the
    // readonly interface (readonly is covariant in reads).
    expectTypeOf<Writable>().toExtend<ResPod>();
  });

  it("types `namespace` as AnyNamespace (string), not a narrower literal", () => {
    expectTypeOf<ResPod["namespace"]>().toEqualTypeOf<AnyNamespace>();
    expectTypeOf<ResPod["namespace"]>().toEqualTypeOf<string>();
  });

  it("types `locale` as the exact union AnyLocale | undefined (missing locales must be representable)", () => {
    expectTypeOf<ResPod["locale"]>().toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf<undefined>().toExtend<ResPod["locale"]>();
    expectTypeOf<AnyLocale>().toExtend<ResPod["locale"]>();
  });

  it("types `family` as ResFamily and intentionally excludes `dynamic-shell`", () => {
    // The data is post-resolution: layout "dynamic-shell" collapses to
    // family "shell" at build time, so the family union never sees it.
    expectTypeOf<ResPod["family"]>().toEqualTypeOf<ResFamily>();
    expectTypeOf<ResPod["family"]>().toEqualTypeOf<"gear" | "vertex-gear" | "shell">();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResPod["family"]>();
  });

  it("types `isReactive` and `isVertex` as plain booleans (not literal true/false)", () => {
    expectTypeOf<ResPod["isReactive"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ResPod["isVertex"]>().toEqualTypeOf<boolean>();
  });

  it("types `plugHead` as AnyPlugHead | undefined (raw resources have no plug)", () => {
    // Matrix origins carry the plug data extracted from the plug at pod
    // build time; raw resources have no plug, so `undefined` must be a
    // representable absence, not a sentinel empty object.
    expectTypeOf<ResPod["plugHead"]>().toEqualTypeOf<AnyPlugHead | undefined>();
    expectTypeOf<undefined>().toExtend<ResPod["plugHead"]>();
    expectTypeOf<AnyPlugHead>().toExtend<ResPod["plugHead"]>();
  });

  it("types `originType` as the closed union of the two canonical origin kinds", () => {
    expectTypeOf<ResPod["originType"]>().toEqualTypeOf<"raw" | "res-matrix">();
    expectTypeOf<string>().not.toExtend<ResPod["originType"]>();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResPod["originType"]>();
  });

  it("types `origin` as the full AnyResOrigin union (package | raw resource)", () => {
    expectTypeOf<ResPod["origin"]>().toEqualTypeOf<AnyResOrigin>();
  });
});

describe("createResPod — signature", () => {
  it("takes (AnyResModule, AnyNamespace, AnyLocale | undefined, ResLayoutType) in this exact order", () => {
    expectTypeOf(createResPod).parameter(0).toEqualTypeOf<AnyResModule>();
    expectTypeOf(createResPod).parameter(1).toEqualTypeOf<AnyNamespace>();
    expectTypeOf(createResPod).parameter(2).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf(createResPod).parameter(3).toEqualTypeOf<ResLayoutEntryType>();
  });

  it("has exactly four required positional parameters — no optional tail, no rest", () => {
    expectTypeOf<Parameters<typeof createResPod>>().toEqualTypeOf<
      [
        module: AnyResModule,
        namespace: AnyNamespace,
        locale: AnyLocale | undefined,
        resourceLayoutType: ResLayoutEntryType,
      ]
    >();
  });

  it("returns ResPod (not widened to unknown, not narrowed to a specific origin-type branch)", () => {
    expectTypeOf(createResPod).returns.toEqualTypeOf<ResPod>();
  });

  it("does not refine the return type based on the layout literal passed in", () => {
    // Even when we pass the narrowest possible literal, the return stays
    // ResPod — the function is intentionally non-generic to keep
    // call sites from having to unwrap discriminated variants.
    const module: AnyResModule = { r: { key: "val" } };
    const d1 = createResPod(module, "ns", undefined, "gear");
    const d2 = createResPod(module, "ns", "en-US", "shell");
    const d3 = createResPod(module, "ns", "en-US", "dynamic-shell");
    expectTypeOf(d1).toEqualTypeOf<ResPod>();
    expectTypeOf(d2).toEqualTypeOf<ResPod>();
    expectTypeOf(d3).toEqualTypeOf<ResPod>();
  });

  it("requires the locale argument to be passed explicitly (undefined is a value, not an omission)", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — locale is required even when undefined
    createResPod(module, "ns", "gear");
    // Baseline: explicit undefined is accepted.
    createResPod(module, "ns", undefined, "gear");
  });

  it("rejects a module that does not satisfy AnyResModule", () => {
    // @ts-expect-error — missing `r`
    createResPod({}, "ns", undefined, "gear");
    // @ts-expect-error — `r` must be a resource origin, not a primitive
    createResPod({ r: "nope" }, "ns", undefined, "gear");
    // @ts-expect-error — null is not an AnyResModule
    createResPod(null, "ns", undefined, "gear");
  });

  it("rejects a namespace that is not a string", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — number is not AnyNamespace
    createResPod(module, 42, undefined, "gear");
    // @ts-expect-error — symbol is not AnyNamespace
    createResPod(module, Symbol("ns"), undefined, "gear");
  });

  it("rejects a locale that is neither string nor undefined", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — number is not a valid locale
    createResPod(module, "ns", 0, "gear");
    // @ts-expect-error — null is explicitly excluded (only undefined is allowed for "no locale")
    createResPod(module, "ns", null, "gear");
  });

  it("rejects a resourceLayoutType that is not a canonical layout literal", () => {
    const module: AnyResModule = { r: {} };
    // @ts-expect-error — "custom" is not a ResLayoutType
    createResPod(module, "ns", undefined, "custom");
    // @ts-expect-error — capitalized variant is not a ResLayoutType
    createResPod(module, "ns", undefined, "Gear");
    // @ts-expect-error — arbitrary string is not assignable to the closed union
    createResPod(module, "ns", undefined, "" as string);
  });

  it("accepts every canonical layout literal at the call site", () => {
    const module: AnyResModule = { r: {} };
    createResPod(module, "ns", undefined, "gear");
    createResPod(module, "ns", "en-US", "shell");
    createResPod(module, "ns", "en-US", "dynamic-shell");
  });
});
