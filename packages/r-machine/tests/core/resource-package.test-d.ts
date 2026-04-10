import { describe, expectTypeOf, it } from "vitest";
import type { AnyResource, AnyResourceOrigin, ResourceFamily } from "../../src/core/resource.js";
import {
  type AnyResourcePackage,
  createResourcePackage,
  type ResourcePackage,
  type ResourcePackageDescriptor,
  tryGetResourcePackageDescriptor,
} from "../../src/core/resource-package.js";
import type { AnyResourcePlug } from "../../src/core/resource-plug.js";

describe("ResourcePackageDescriptor", () => {
  it("has exactly the declared fields — no implicit additions", () => {
    type Keys = keyof ResourcePackageDescriptor;
    expectTypeOf<Keys>().toEqualTypeOf<"family" | "isReactive" | "isVertex">();
  });

  it("types `family` as ResourceFamily (gear | shell), excluding dynamic-shell", () => {
    // The descriptor is the post-resolution artefact; `dynamic-shell` is a
    // *layout* concept and must not leak into the family at this level.
    expectTypeOf<ResourcePackageDescriptor["family"]>().toEqualTypeOf<ResourceFamily>();
    expectTypeOf<ResourcePackageDescriptor["family"]>().toEqualTypeOf<"gear" | "shell">();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResourcePackageDescriptor["family"]>();
  });

  it("types the boolean flags as plain booleans (not widened, not literal)", () => {
    expectTypeOf<ResourcePackageDescriptor["isReactive"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ResourcePackageDescriptor["isVertex"]>().toEqualTypeOf<boolean>();
  });

  it("marks every field as readonly (writable twin is not assignable)", () => {
    type Writable = { family: ResourceFamily; isReactive: boolean; isVertex: boolean };
    expectTypeOf<ResourcePackageDescriptor>().not.toEqualTypeOf<Writable>();
    // Sanity: the writable form is still structurally assignable.
    expectTypeOf<Writable>().toExtend<ResourcePackageDescriptor>();
  });
});

describe("ResourcePackage", () => {
  it("is generic over a resource R and a plug P", () => {
    // The generic parameters must be preserved so that consumers can hold
    // narrowly-typed packages (e.g. `ResourcePackage<MyResource, MyPlug>`).
    type Specific = ResourcePackage<{ greeting: string }, AnyResourcePlug>;
    expectTypeOf<Specific>().toExtend<AnyResourcePackage>();
  });

  it("exposes `factory` as a zero-argument function returning Promise<R>", () => {
    type Specific = ResourcePackage<{ greeting: string }, AnyResourcePlug>;
    expectTypeOf<Specific["factory"]>().toEqualTypeOf<() => Promise<{ greeting: string }>>();
    expectTypeOf<Specific["factory"]>().parameters.toEqualTypeOf<[]>();
  });

  it("exposes `plug` as the exact P type passed in", () => {
    interface MyPlug extends AnyResourcePlug {
      readonly marker: "my-plug";
    }
    type Specific = ResourcePackage<AnyResource, MyPlug>;
    expectTypeOf<Specific["plug"]>().toEqualTypeOf<MyPlug>();
  });

  it("marks `factory` and `plug` as readonly", () => {
    // Structural test: the mutable twin must not be equal to the interface.
    type Writable<R extends AnyResource, P extends AnyResourcePlug> = {
      factory: () => Promise<R>;
      plug: P;
    };
    expectTypeOf<ResourcePackage<AnyResource, AnyResourcePlug>>().not.toEqualTypeOf<
      Writable<AnyResource, AnyResourcePlug>
    >();
  });

  it("does NOT expose `descriptor` as a public field (the symbol key replaced it)", () => {
    // Regression guard: the old shape had a `descriptor` field; the refactor
    // collapsed brand + descriptor into a single symbol-keyed slot. If this
    // ever comes back, the type should start showing the field here.
    expectTypeOf<"descriptor">().not.toExtend<keyof ResourcePackage<AnyResource, AnyResourcePlug>>();
  });
});

describe("AnyResourcePackage", () => {
  it("is structurally equal to ResourcePackage<AnyResource, AnyResourcePlug>", () => {
    expectTypeOf<AnyResourcePackage>().toEqualTypeOf<ResourcePackage<AnyResource, AnyResourcePlug>>();
  });

  it("is a member of AnyResourceOrigin", () => {
    expectTypeOf<AnyResourcePackage>().toExtend<AnyResourceOrigin>();
  });
});

describe("createResourcePackage — signature", () => {
  it("takes (descriptor, factory, plug) in this exact order with the declared parameter types", () => {
    expectTypeOf(createResourcePackage).parameter(0).toEqualTypeOf<ResourcePackageDescriptor>();
    // parameter(1) is generic-dependent; we check via the full parameter tuple below.
    expectTypeOf(createResourcePackage).parameter(2).toExtend<AnyResourcePlug>();
  });

  it("has exactly three required positional parameters (no optional tail)", () => {
    // We pin the arity via Parameters<> to catch accidental additions.
    // Using the `AnyResource`/`AnyResourcePlug` instantiation because a bare
    // reference to the generic function widens unpredictably in Parameters<>.
    type Args = Parameters<typeof createResourcePackage<AnyResource, AnyResourcePlug>>;
    expectTypeOf<Args>().toEqualTypeOf<
      [descriptor: ResourcePackageDescriptor, factory: () => Promise<AnyResource>, plug: AnyResourcePlug]
    >();
  });

  it("returns a ResourcePackage<R, P> that preserves both generic parameters at the call site", () => {
    interface MyResource extends AnyResource {
      readonly greeting: string;
    }
    interface MyPlug extends AnyResourcePlug {
      readonly marker: "my-plug";
    }
    const descriptor: ResourcePackageDescriptor = { family: "gear", isReactive: false, isVertex: false };
    const factory = async (): Promise<MyResource> => ({ greeting: "hi" });
    const plug = {} as MyPlug;

    const pkg = createResourcePackage(descriptor, factory, plug);

    // The return type must preserve BOTH generic parameters — neither
    // widened to AnyResource nor dropped to AnyResourcePackage.
    expectTypeOf(pkg).toEqualTypeOf<ResourcePackage<MyResource, MyPlug>>();
    expectTypeOf(pkg.factory).toEqualTypeOf<() => Promise<MyResource>>();
    expectTypeOf(pkg.plug).toEqualTypeOf<MyPlug>();
  });

  it("is assignable to AnyResourcePackage at the return position", () => {
    // Sanity for the `AnyResourcePackage` alias — a specific package must
    // flow into any slot typed with the erased variant.
    const pkg: AnyResourcePackage = createResourcePackage(
      { family: "gear", isReactive: false, isVertex: false },
      async () => ({}),
      {} as AnyResourcePlug
    );
    expectTypeOf(pkg).toExtend<AnyResourcePackage>();
  });

  it("rejects a descriptor whose family is not a ResourceFamily literal", () => {
    // @ts-expect-error — "dynamic-shell" is a layout, not a family
    createResourcePackage({ family: "dynamic-shell", isReactive: false, isVertex: false }, async () => ({}), {});
    // @ts-expect-error — arbitrary strings are not valid families
    createResourcePackage({ family: "custom", isReactive: false, isVertex: false }, async () => ({}), {});
  });

  it("rejects a descriptor missing required fields", () => {
    // @ts-expect-error — isVertex is required
    createResourcePackage({ family: "gear", isReactive: false }, async () => ({}), {});
    // @ts-expect-error — isReactive is required
    createResourcePackage({ family: "gear", isVertex: false }, async () => ({}), {});
    // @ts-expect-error — family is required
    createResourcePackage({ isReactive: false, isVertex: false }, async () => ({}), {});
  });

  it("rejects a factory whose return type is not a Promise", () => {
    // @ts-expect-error — synchronous return is not assignable to () => Promise<R>
    createResourcePackage({ family: "gear", isReactive: false, isVertex: false }, () => ({}), {});
  });

  it("rejects a factory that takes arguments (it must be nullary)", () => {
    const descriptor: ResourcePackageDescriptor = { family: "gear", isReactive: false, isVertex: false };
    // @ts-expect-error — extra parameters are not permitted
    createResourcePackage(descriptor, async (arg: string) => ({ arg }), {});
  });
});

describe("tryGetResourcePackageDescriptor — signature", () => {
  it("takes an AnyResourceOrigin and returns ResourcePackageDescriptor | undefined", () => {
    expectTypeOf(tryGetResourcePackageDescriptor).parameter(0).toEqualTypeOf<AnyResourceOrigin>();
    expectTypeOf(tryGetResourcePackageDescriptor).returns.toEqualTypeOf<ResourcePackageDescriptor | undefined>();
  });

  it("has exactly one required positional parameter", () => {
    expectTypeOf<Parameters<typeof tryGetResourcePackageDescriptor>>().toEqualTypeOf<[origin: AnyResourceOrigin]>();
  });

  it("always includes undefined in the return type (absence must be representable)", () => {
    expectTypeOf<undefined>().toExtend<ReturnType<typeof tryGetResourcePackageDescriptor>>();
  });

  it("accepts both variants of AnyResourceOrigin at the call site", () => {
    const pkg: AnyResourcePackage = createResourcePackage(
      { family: "gear", isReactive: false, isVertex: false },
      async () => ({}),
      {} as AnyResourcePlug
    );
    const raw: AnyResource = { greeting: "hi" };

    expectTypeOf(tryGetResourcePackageDescriptor(pkg)).toEqualTypeOf<ResourcePackageDescriptor | undefined>();
    expectTypeOf(tryGetResourcePackageDescriptor(raw)).toEqualTypeOf<ResourcePackageDescriptor | undefined>();
  });
});
