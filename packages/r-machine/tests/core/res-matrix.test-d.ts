import { describe, expectTypeOf, it } from "vitest";
import type { AnyRes, AnyResOrigin, ResFamily } from "../../src/core/res.js";
import {
  type AnyResMatrix,
  createResMatrix,
  type ResMatrix,
  type ResMatrixMeta,
  tryGetResMatrixMeta,
} from "../../src/core/res-matrix.js";
import type { AnyResPlug } from "../../src/core/res-plug.js";

describe("ResMatrixMeta", () => {
  it("has exactly the declared fields — no implicit additions", () => {
    type Keys = keyof ResMatrixMeta;
    expectTypeOf<Keys>().toEqualTypeOf<"family" | "isReactive" | "isVertex">();
  });

  it("types `family` as ResFamily (gear | vertex-gear | shell), excluding dynamic-shell", () => {
    // The meta is the post-resolution artefact; `dynamic-shell` is a
    // *layout* concept and must not leak into the family at this level.
    expectTypeOf<ResMatrixMeta["family"]>().toEqualTypeOf<ResFamily>();
    expectTypeOf<ResMatrixMeta["family"]>().toEqualTypeOf<"gear" | "vertex-gear" | "shell">();
    expectTypeOf<"dynamic-shell">().not.toExtend<ResMatrixMeta["family"]>();
  });

  it("types the boolean flags as plain booleans (not widened, not literal)", () => {
    expectTypeOf<ResMatrixMeta["isReactive"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ResMatrixMeta["isVertex"]>().toEqualTypeOf<boolean>();
  });

  it("marks every field as readonly (writable twin is not assignable)", () => {
    type Writable = { family: ResFamily; isReactive: boolean; isVertex: boolean };
    expectTypeOf<ResMatrixMeta>().not.toEqualTypeOf<Writable>();
    // Sanity: the writable form is still structurally assignable.
    expectTypeOf<Writable>().toExtend<ResMatrixMeta>();
  });
});

describe("ResMatrix", () => {
  it("is generic over a resource R and a plug P", () => {
    // The generic parameters must be preserved so that consumers can hold
    // narrowly-typed matrices (e.g. `ResMatrix<MyResource, MyPlug>`).
    type Specific = ResMatrix<{ greeting: string }, AnyResPlug>;
    expectTypeOf<Specific>().toExtend<AnyResMatrix>();
  });

  it("exposes `factory` as a zero-argument function returning Promise<R>", () => {
    type Specific = ResMatrix<{ greeting: string }, AnyResPlug>;
    expectTypeOf<Specific["factory"]>().toEqualTypeOf<() => Promise<{ greeting: string }>>();
    expectTypeOf<Specific["factory"]>().parameters.toEqualTypeOf<[]>();
  });

  it("exposes `plug` as the exact P type passed in", () => {
    // `AnyResPlug` is a union of concrete plug shapes, so we cannot declare
    // a derived plug via `interface extends` — we use an intersection type
    // alias instead, which distributes over the union and preserves the
    // `[plugHead]` symbol key each member carries.
    type MyPlug = AnyResPlug & { readonly marker: "my-plug" };
    type Specific = ResMatrix<AnyRes, MyPlug>;
    expectTypeOf<Specific["plug"]>().toEqualTypeOf<MyPlug>();
  });

  it("marks `factory` and `plug` as readonly", () => {
    // Structural test: the mutable twin must not be equal to the interface.
    type Writable<R extends AnyRes, P extends AnyResPlug> = {
      factory: () => Promise<R>;
      plug: P;
    };
    expectTypeOf<ResMatrix<AnyRes, AnyResPlug>>().not.toEqualTypeOf<Writable<AnyRes, AnyResPlug>>();
  });

  it("does NOT expose `data` as a public field (the symbol key replaced it)", () => {
    // Regression guard: the old shape had a `data` field; the refactor
    // collapsed brand + data into a single symbol-keyed slot. If this
    // ever comes back, the type should start showing the field here.
    expectTypeOf<"data">().not.toExtend<keyof ResMatrix<AnyRes, AnyResPlug>>();
  });
});

describe("AnyResMatrix", () => {
  it("is structurally equal to ResMatrix<any, any>", () => {
    expectTypeOf<AnyResMatrix>().toEqualTypeOf<ResMatrix<any, any>>();
  });

  it("is a member of AnyResOrigin", () => {
    expectTypeOf<AnyResMatrix>().toExtend<AnyResOrigin>();
  });
});

describe("createResMatrix — signature", () => {
  it("takes (meta, factory, plug) in this exact order with the declared parameter types", () => {
    expectTypeOf(createResMatrix).parameter(0).toEqualTypeOf<ResMatrixMeta>();
    // parameter(1) is generic-dependent; we check via the full parameter tuple below.
    expectTypeOf(createResMatrix).parameter(2).toExtend<AnyResPlug>();
  });

  it("has exactly three required positional parameters (no optional tail)", () => {
    // We pin the arity via Parameters<> to catch accidental additions.
    // Using the `AnyRes`/`AnyResPlug` instantiation because a bare
    // reference to the generic function widens unpredictably in Parameters<>.
    type Args = Parameters<typeof createResMatrix<AnyRes, AnyResPlug>>;
    expectTypeOf<Args>().toEqualTypeOf<[meta: ResMatrixMeta, factory: () => Promise<AnyRes>, plug: AnyResPlug]>();
  });

  it("returns a ResMatrix<R, P> that preserves both generic parameters at the call site", () => {
    interface MyResource extends AnyRes {
      readonly greeting: string;
    }
    // Type alias (not interface) because `AnyResPlug` is a union — see the
    // earlier `exposes plug as the exact P type` test for the rationale.
    type MyPlug = AnyResPlug & { readonly marker: "my-plug" };
    const meta: ResMatrixMeta = { family: "gear", isReactive: false, isVertex: false };
    const factory = async (): Promise<MyResource> => ({ greeting: "hi" });
    const plug = {} as MyPlug;

    const mat = createResMatrix(meta, factory, plug);

    // The return type must preserve BOTH generic parameters — neither
    // widened to AnyRes nor dropped to AnyResMatrix.
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
      {} as AnyResPlug
    );
    expectTypeOf(mat).toExtend<AnyResMatrix>();
  });

  it("rejects a meta whose family is not a ResFamily literal", () => {
    // @ts-expect-error — "dynamic-shell" is a layout, not a family
    createResMatrix({ family: "dynamic-shell", isReactive: false, isVertex: false }, async () => ({}), {});
    // @ts-expect-error — arbitrary strings are not valid families
    createResMatrix({ family: "custom", isReactive: false, isVertex: false }, async () => ({}), {});
  });

  it("rejects a meta missing required fields", () => {
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
    const meta: ResMatrixMeta = { family: "gear", isReactive: false, isVertex: false };
    // @ts-expect-error — extra parameters are not permitted
    createResMatrix(meta, async (arg: string) => ({ arg }), {});
  });
});

describe("tryGetResMatrixMeta — signature", () => {
  it("takes an AnyResOrigin and returns ResMatrixMeta | undefined", () => {
    expectTypeOf(tryGetResMatrixMeta).parameter(0).toEqualTypeOf<AnyResOrigin>();
    expectTypeOf(tryGetResMatrixMeta).returns.toEqualTypeOf<ResMatrixMeta | undefined>();
  });

  it("has exactly one required positional parameter", () => {
    expectTypeOf<Parameters<typeof tryGetResMatrixMeta>>().toEqualTypeOf<[origin: AnyResOrigin]>();
  });

  it("always includes undefined in the return type (absence must be representable)", () => {
    expectTypeOf<undefined>().toExtend<ReturnType<typeof tryGetResMatrixMeta>>();
  });

  it("accepts both variants of AnyResOrigin at the call site", () => {
    const mat: AnyResMatrix = createResMatrix(
      { family: "gear", isReactive: false, isVertex: false },
      async () => ({}),
      {} as AnyResPlug
    );
    const raw: AnyRes = { greeting: "hi" };

    expectTypeOf(tryGetResMatrixMeta(mat)).toEqualTypeOf<ResMatrixMeta | undefined>();
    expectTypeOf(tryGetResMatrixMeta(raw)).toEqualTypeOf<ResMatrixMeta | undefined>();
  });
});
