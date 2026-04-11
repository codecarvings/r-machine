import { describe, expectTypeOf, it } from "vitest";
import {
  type AnyResMatrix,
  createResMatrix,
  type ResMatrix,
  type ResMatrixDescriptor,
  tryGetResMatrixDescriptor,
} from "../../src/core/res-matrix.js";
import type { AnyResource, AnyResourceOrigin, ResourceFamily } from "../../src/core/resource.js";
import type { AnyResourcePlug } from "../../src/core/resource-plug.js";

describe("ResMatrixDescriptor", () => {
  it("has exactly the declared fields — no implicit additions", () => {
    type Keys = keyof ResMatrixDescriptor;
    expectTypeOf<Keys>().toEqualTypeOf<"family" | "isReactive" | "isVertex">();
  });

  it("types `family` as ResourceFamily (gear | shell), excluding dynamic-shell", () => {
    // The descriptor is the post-resolution artefact; `dynamic-shell` is a
    // *layout* concept and must not leak into the family at this level.
    expectTypeOf<ResMatrixDescriptor["family"]>().toEqualTypeOf<ResourceFamily>();
    expectTypeOf<ResMatrixDescriptor["family"]>().toEqualTypeOf<"gear" | "shell">();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResMatrixDescriptor["family"]>();
  });

  it("types the boolean flags as plain booleans (not widened, not literal)", () => {
    expectTypeOf<ResMatrixDescriptor["isReactive"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ResMatrixDescriptor["isVertex"]>().toEqualTypeOf<boolean>();
  });

  it("marks every field as readonly (writable twin is not assignable)", () => {
    type Writable = { family: ResourceFamily; isReactive: boolean; isVertex: boolean };
    expectTypeOf<ResMatrixDescriptor>().not.toEqualTypeOf<Writable>();
    // Sanity: the writable form is still structurally assignable.
    expectTypeOf<Writable>().toExtend<ResMatrixDescriptor>();
  });
});

describe("ResMatrix", () => {
  it("is generic over a resource R and a plug P", () => {
    // The generic parameters must be preserved so that consumers can hold
    // narrowly-typed matrices (e.g. `ResMatrix<MyResource, MyPlug>`).
    type Specific = ResMatrix<{ greeting: string }, AnyResourcePlug>;
    expectTypeOf<Specific>().toExtend<AnyResMatrix>();
  });

  it("exposes `factory` as a zero-argument function returning Promise<R>", () => {
    type Specific = ResMatrix<{ greeting: string }, AnyResourcePlug>;
    expectTypeOf<Specific["factory"]>().toEqualTypeOf<() => Promise<{ greeting: string }>>();
    expectTypeOf<Specific["factory"]>().parameters.toEqualTypeOf<[]>();
  });

  it("exposes `plug` as the exact P type passed in", () => {
    interface MyPlug extends AnyResourcePlug {
      readonly marker: "my-plug";
    }
    type Specific = ResMatrix<AnyResource, MyPlug>;
    expectTypeOf<Specific["plug"]>().toEqualTypeOf<MyPlug>();
  });

  it("marks `factory` and `plug` as readonly", () => {
    // Structural test: the mutable twin must not be equal to the interface.
    type Writable<R extends AnyResource, P extends AnyResourcePlug> = {
      factory: () => Promise<R>;
      plug: P;
    };
    expectTypeOf<ResMatrix<AnyResource, AnyResourcePlug>>().not.toEqualTypeOf<
      Writable<AnyResource, AnyResourcePlug>
    >();
  });

  it("does NOT expose `descriptor` as a public field (the symbol key replaced it)", () => {
    // Regression guard: the old shape had a `descriptor` field; the refactor
    // collapsed brand + descriptor into a single symbol-keyed slot. If this
    // ever comes back, the type should start showing the field here.
    expectTypeOf<"descriptor">().not.toExtend<keyof ResMatrix<AnyResource, AnyResourcePlug>>();
  });
});

describe("AnyResMatrix", () => {
  it("is structurally equal to ResMatrix<AnyResource, AnyResourcePlug>", () => {
    expectTypeOf<AnyResMatrix>().toEqualTypeOf<ResMatrix<AnyResource, AnyResourcePlug>>();
  });

  it("is a member of AnyResourceOrigin", () => {
    expectTypeOf<AnyResMatrix>().toExtend<AnyResourceOrigin>();
  });
});

describe("createResMatrix — signature", () => {
  it("takes (descriptor, factory, plug) in this exact order with the declared parameter types", () => {
    expectTypeOf(createResMatrix).parameter(0).toEqualTypeOf<ResMatrixDescriptor>();
    // parameter(1) is generic-dependent; we check via the full parameter tuple below.
    expectTypeOf(createResMatrix).parameter(2).toExtend<AnyResourcePlug>();
  });

  it("has exactly three required positional parameters (no optional tail)", () => {
    // We pin the arity via Parameters<> to catch accidental additions.
    // Using the `AnyResource`/`AnyResourcePlug` instantiation because a bare
    // reference to the generic function widens unpredictably in Parameters<>.
    type Args = Parameters<typeof createResMatrix<AnyResource, AnyResourcePlug>>;
    expectTypeOf<Args>().toEqualTypeOf<
      [descriptor: ResMatrixDescriptor, factory: () => Promise<AnyResource>, plug: AnyResourcePlug]
    >();
  });

  it("returns a ResMatrix<R, P> that preserves both generic parameters at the call site", () => {
    interface MyResource extends AnyResource {
      readonly greeting: string;
    }
    interface MyPlug extends AnyResourcePlug {
      readonly marker: "my-plug";
    }
    const descriptor: ResMatrixDescriptor = { family: "gear", isReactive: false, isVertex: false };
    const factory = async (): Promise<MyResource> => ({ greeting: "hi" });
    const plug = {} as MyPlug;

    const mat = createResMatrix(descriptor, factory, plug);

    // The return type must preserve BOTH generic parameters — neither
    // widened to AnyResource nor dropped to AnyResMatrix.
    expectTypeOf(mat).toEqualTypeOf<ResMatrix<MyResource, MyPlug>>();
    expectTypeOf(mat.factory).toEqualTypeOf<() => Promise<MyResource>>();
    expectTypeOf(mat.plug).toEqualTypeOf<MyPlug>();
  });

  it("is assignable to AnyResMatrix at the return position", () => {
    // Sanity for the `AnyResMatrix` alias — a specific matrix must
    // flow into any slot typed with the erased variant.
    const mat: AnyResMatrix = createResMatrix(
      { family: "gear", isReactive: false, isVertex: false },
      async () => ({}),
      {} as AnyResourcePlug
    );
    expectTypeOf(mat).toExtend<AnyResMatrix>();
  });

  it("rejects a descriptor whose family is not a ResourceFamily literal", () => {
    // @ts-expect-error — "dynamic-shell" is a layout, not a family
    createResMatrix({ family: "dynamic-shell", isReactive: false, isVertex: false }, async () => ({}), {});
    // @ts-expect-error — arbitrary strings are not valid families
    createResMatrix({ family: "custom", isReactive: false, isVertex: false }, async () => ({}), {});
  });

  it("rejects a descriptor missing required fields", () => {
    // @ts-expect-error — isVertex is required
    createResMatrix({ family: "gear", isReactive: false }, async () => ({}), {});
    // @ts-expect-error — isReactive is required
    createResMatrix({ family: "gear", isVertex: false }, async () => ({}), {});
    // @ts-expect-error — family is required
    createResMatrix({ isReactive: false, isVertex: false }, async () => ({}), {});
  });

  it("rejects a factory whose return type is not a Promise", () => {
    // @ts-expect-error — synchronous return is not assignable to () => Promise<R>
    createResMatrix({ family: "gear", isReactive: false, isVertex: false }, () => ({}), {});
  });

  it("rejects a factory that takes arguments (it must be nullary)", () => {
    const descriptor: ResMatrixDescriptor = { family: "gear", isReactive: false, isVertex: false };
    // @ts-expect-error — extra parameters are not permitted
    createResMatrix(descriptor, async (arg: string) => ({ arg }), {});
  });
});

describe("tryGetResMatrixDescriptor — signature", () => {
  it("takes an AnyResourceOrigin and returns ResMatrixDescriptor | undefined", () => {
    expectTypeOf(tryGetResMatrixDescriptor).parameter(0).toEqualTypeOf<AnyResourceOrigin>();
    expectTypeOf(tryGetResMatrixDescriptor).returns.toEqualTypeOf<ResMatrixDescriptor | undefined>();
  });

  it("has exactly one required positional parameter", () => {
    expectTypeOf<Parameters<typeof tryGetResMatrixDescriptor>>().toEqualTypeOf<[origin: AnyResourceOrigin]>();
  });

  it("always includes undefined in the return type (absence must be representable)", () => {
    expectTypeOf<undefined>().toExtend<ReturnType<typeof tryGetResMatrixDescriptor>>();
  });

  it("accepts both variants of AnyResourceOrigin at the call site", () => {
    const mat: AnyResMatrix = createResMatrix(
      { family: "gear", isReactive: false, isVertex: false },
      async () => ({}),
      {} as AnyResourcePlug
    );
    const raw: AnyResource = { greeting: "hi" };

    expectTypeOf(tryGetResMatrixDescriptor(mat)).toEqualTypeOf<ResMatrixDescriptor | undefined>();
    expectTypeOf(tryGetResMatrixDescriptor(raw)).toEqualTypeOf<ResMatrixDescriptor | undefined>();
  });
});
