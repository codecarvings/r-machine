import { describe, expectTypeOf, it } from "vitest";
import type { GearRole } from "../../src/core/gear-plug.js";
import type { NamespaceParts } from "../../src/core/res-domain.js";
import {
  type AnyResLayout,
  getGearRoleFromLayoutType,
  getResFamilyFromLayoutType,
  isOuterGearLayoutType,
  isVertexGearLayoutType,
  type ResLayoutEntryType,
  ResLayoutResolver,
  type ResolveLayoutType,
} from "../../src/core/res-layout.js";
import type { ResFamily } from "../../src/core/res-plug.js";
import type { AnyLocale } from "../../src/locale/locale.js";

describe("ResLayoutEntryType", () => {
  it("is the exact union of the six canonical layout literals", () => {
    expectTypeOf<ResLayoutEntryType>().toEqualTypeOf<
      "gear:inner" | "gear:base" | "gear:outer" | "gear:outer(vertex)" | "shell" | "shell(mono)"
    >();
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

  it("accepts the six canonical layout types as values", () => {
    expectTypeOf<"gear:inner">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"gear:base">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"gear:outer">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"gear:outer(vertex)">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"shell">().toExtend<ResLayoutEntryType>();
    expectTypeOf<"shell(mono)">().toExtend<ResLayoutEntryType>();
  });

  it("rejects unrelated string literals as values", () => {
    expectTypeOf<"not-a-layout">().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<"Gear">().not.toExtend<ResLayoutEntryType>();
    // Old, no-longer-valid layout literals must NOT slip through.
    expectTypeOf<"gear">().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<"gear:vertex">().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<"shell:mono">().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<string>().not.toExtend<ResLayoutEntryType>();
  });

  it("does not accept non-string values", () => {
    expectTypeOf<number>().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<null>().not.toExtend<ResLayoutEntryType>();
    expectTypeOf<undefined>().not.toExtend<ResLayoutEntryType>();
  });

  it("accepts an object literal whose keys end with '/' and values are layout types", () => {
    const layout = {
      "app/": "gear:inner",
      "app/settings/": "shell",
      "app/live/": "shell(mono)",
    } as const satisfies AnyResLayout;
    expectTypeOf(layout).toExtend<AnyResLayout>();
  });

  it("rejects an object literal whose keys do not end with '/'", () => {
    // @ts-expect-error — "app" does not end with "/" so it fails the index-signature constraint
    const _bad = { app: "gear:inner" } as const satisfies AnyResLayout;
  });
});

describe("ResLayoutResolver — class signature", () => {
  it("is constructible with an AnyResLayout", () => {
    expectTypeOf(ResLayoutResolver).toBeConstructibleWith({} as AnyResLayout);
  });

  it("constructor parameters are exactly [layout: AnyResLayout]", () => {
    expectTypeOf(ResLayoutResolver).constructorParameters.toEqualTypeOf<[layout: AnyResLayout]>();
  });

  it("resolveLayoutEntryType takes a namespace string and returns ResLayoutEntryType (no undefined — misses throw)", () => {
    const resolver = new ResLayoutResolver({});
    expectTypeOf(resolver.resolveLayoutEntryType).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(resolver.resolveLayoutEntryType).returns.toEqualTypeOf<ResLayoutEntryType>();
    // The return type does NOT include undefined: misses are signaled by
    // throwing RMachineResolveError, not by returning undefined.
    expectTypeOf<undefined>().not.toExtend<ReturnType<typeof resolver.resolveLayoutEntryType>>();
  });

  it("resolveNamespaceParts takes a namespace string and returns NamespaceParts", () => {
    const resolver = new ResLayoutResolver({});
    expectTypeOf(resolver.resolveNamespaceParts).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(resolver.resolveNamespaceParts).returns.toEqualTypeOf<NamespaceParts>();
  });

  it("resolvePath takes (namespace, locale | undefined, layoutEntryType) and returns string", () => {
    const resolver = new ResLayoutResolver({});
    expectTypeOf(resolver.resolvePath).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(resolver.resolvePath).parameter(1).toEqualTypeOf<AnyLocale | undefined>();
    expectTypeOf(resolver.resolvePath).parameter(2).toEqualTypeOf<ResLayoutEntryType>();
    expectTypeOf(resolver.resolvePath).returns.toEqualTypeOf<string>();
  });

  it("resolvePath has an arity of exactly three required positional parameters", () => {
    const resolver = new ResLayoutResolver({});
    expectTypeOf<Parameters<typeof resolver.resolvePath>>().toEqualTypeOf<
      [namespace: string, locale: AnyLocale | undefined, layoutEntryType: ResLayoutEntryType]
    >();
  });

  it("resolvePath rejects calls missing any required argument", () => {
    const resolver = new ResLayoutResolver({});
    // @ts-expect-error — locale and layoutEntryType are required
    resolver.resolvePath("app");
    // @ts-expect-error — layoutEntryType is required
    resolver.resolvePath("app", undefined);
    // Baseline: all three explicit is accepted.
    resolver.resolvePath("app", undefined, "gear:inner");
  });

  it("resolvePath rejects a layoutEntryType that is not a canonical literal", () => {
    const resolver = new ResLayoutResolver({});
    // @ts-expect-error — "custom" is not a valid ResLayoutEntryType
    resolver.resolvePath("app", undefined, "custom");
    // @ts-expect-error — old "gear" literal is no longer valid
    resolver.resolvePath("app", undefined, "gear");
    // @ts-expect-error — numbers are not layout types
    resolver.resolvePath("app", undefined, 42);
  });
});

describe("getResFamilyFromLayoutType — signature", () => {
  it("takes a ResLayoutEntryType and returns ResFamily", () => {
    expectTypeOf(getResFamilyFromLayoutType).parameter(0).toEqualTypeOf<ResLayoutEntryType>();
    expectTypeOf(getResFamilyFromLayoutType).returns.toEqualTypeOf<ResFamily>();
  });
});

describe("getGearRoleFromLayoutType — signature", () => {
  it("takes a ResLayoutEntryType and returns GearRole | undefined", () => {
    expectTypeOf(getGearRoleFromLayoutType).parameter(0).toEqualTypeOf<ResLayoutEntryType>();
    expectTypeOf(getGearRoleFromLayoutType).returns.toEqualTypeOf<GearRole | undefined>();
  });
});

describe("isOuterGearLayoutType / isVertexGearLayoutType — signatures", () => {
  it("each takes a ResLayoutEntryType and returns boolean", () => {
    expectTypeOf(isOuterGearLayoutType).parameter(0).toEqualTypeOf<ResLayoutEntryType>();
    expectTypeOf(isOuterGearLayoutType).returns.toEqualTypeOf<boolean>();
    expectTypeOf(isVertexGearLayoutType).parameter(0).toEqualTypeOf<ResLayoutEntryType>();
    expectTypeOf(isVertexGearLayoutType).returns.toEqualTypeOf<boolean>();
  });
});

describe("ResolveLayoutType — type-level longest-prefix resolver", () => {
  it("resolves the entry type for a namespace equal to the prefix's base", () => {
    type R = ResolveLayoutType<{ "app/": "gear:inner" }, "app">;
    expectTypeOf<R>().toEqualTypeOf<"gear:inner">();
  });

  it("resolves the entry type for a child namespace at a '/' boundary", () => {
    type R = ResolveLayoutType<{ "app/": "gear:inner" }, "app/home">;
    expectTypeOf<R>().toEqualTypeOf<"gear:inner">();
  });

  it("returns never when no prefix matches", () => {
    type R = ResolveLayoutType<{ "app/": "gear:inner" }, "other">;
    expectTypeOf<R>().toEqualTypeOf<never>();
  });

  it("does not match a longer namespace that merely starts with the prefix's base", () => {
    type R = ResolveLayoutType<{ "app/": "gear:inner" }, "application">;
    expectTypeOf<R>().toEqualTypeOf<never>();
  });

  it("picks the most specific prefix when multiple prefixes match (longest-prefix-wins)", () => {
    type Layout = { "app/": "gear:inner"; "app/settings/": "shell" };
    type R1 = ResolveLayoutType<Layout, "app/settings/theme">;
    type R2 = ResolveLayoutType<Layout, "app/home">;
    expectTypeOf<R1>().toEqualTypeOf<"shell">();
    expectTypeOf<R2>().toEqualTypeOf<"gear:inner">();
  });

  it("is independent of the declaration order in the layout", () => {
    type LayoutA = { "app/": "gear:inner"; "app/settings/": "shell" };
    type LayoutB = { "app/settings/": "shell"; "app/": "gear:inner" };
    type RA = ResolveLayoutType<LayoutA, "app/settings">;
    type RB = ResolveLayoutType<LayoutB, "app/settings">;
    expectTypeOf<RA>().toEqualTypeOf<RB>();
  });
});
