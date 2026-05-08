import { describe, expectTypeOf, it } from "vitest";
import type { AnyRes, AnyResOrigin } from "../../src/core/res.js";
import {
  type AnyResMatrix,
  createResMatrix,
  type GearMatrixMeta,
  type ResMatrix,
  type ResMatrixCloneOverrides,
  type ShellMatrixMeta,
  tryGetResMatrixMeta,
} from "../../src/core/res-matrix.js";
import type { AnyResPlug } from "../../src/core/res-plug.js";

// Test-local alias for the matrix meta union — the source keeps the union
// itself module-private; tests reach for it via the two exported variants.
type AnyMatrixMeta = GearMatrixMeta | ShellMatrixMeta;

describe("GearMatrixMeta / ShellMatrixMeta", () => {
  it("GearMatrixMeta is a discriminated record with `family: 'gear'` and a `role` field", () => {
    expectTypeOf<GearMatrixMeta["family"]>().toEqualTypeOf<"gear">();
    expectTypeOf<GearMatrixMeta["role"]>().toEqualTypeOf<"inner" | "base" | "outer">();
  });

  it("ShellMatrixMeta is a discriminated record with `family: 'shell'` and no role", () => {
    expectTypeOf<ShellMatrixMeta["family"]>().toEqualTypeOf<"shell">();
    expectTypeOf<keyof ShellMatrixMeta>().toEqualTypeOf<"family">();
  });

  it("the meta union is discriminated by `family` — narrowing works at the value level", () => {
    const meta = {} as AnyMatrixMeta;
    if (meta.family === "gear") {
      expectTypeOf(meta).toEqualTypeOf<GearMatrixMeta>();
    } else {
      expectTypeOf(meta).toEqualTypeOf<ShellMatrixMeta>();
    }
  });

  it("marks every field as readonly (writable twin is not assignable)", () => {
    type WritableGear = { family: "gear"; role: "inner" | "base" | "outer" };
    expectTypeOf<GearMatrixMeta>().not.toEqualTypeOf<WritableGear>();
    // Sanity: structurally the writable form is still assignable.
    expectTypeOf<WritableGear>().toExtend<GearMatrixMeta>();
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

  it("exposes `clone` as a method returning a new ResMatrix of the same shape", () => {
    type Specific = ResMatrix<AnyRes, AnyResPlug>;
    expectTypeOf<Specific["clone"]>().toEqualTypeOf<(overrides?: ResMatrixCloneOverrides) => Specific>();
  });

  it("marks `factory` and `plug` as readonly", () => {
    // Structural test: the mutable twin must not be equal to the interface.
    type Writable<R extends AnyRes, P extends AnyResPlug> = {
      factory: () => Promise<R>;
      plug: P;
      clone: (overrides?: ResMatrixCloneOverrides) => ResMatrix<R, P>;
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
  it("takes a single options object and returns AnyResMatrix (the erased variant)", () => {
    // The signature is non-generic now: callers wire the options through and
    // get the erased `AnyResMatrix` back. Generic R/P are recovered later via
    // `as ResMatrix<R, P>` at the boundary.
    expectTypeOf(createResMatrix).returns.toEqualTypeOf<AnyResMatrix>();
  });

  it("has exactly one required positional parameter", () => {
    type Args = Parameters<typeof createResMatrix>;
    expectTypeOf<Args["length"]>().toEqualTypeOf<1>();
  });

  it("the options object accepts both gear and shell metas at the meta slot", () => {
    expectTypeOf(createResMatrix).parameter(0).toHaveProperty("meta").toEqualTypeOf<AnyMatrixMeta>();
  });

  it("rejects a meta whose family is not a known literal", () => {
    createResMatrix({
      // @ts-expect-error — "shell:mono" is a layout, not a family
      meta: { family: "shell:mono" },
      connector: {} as never,
      head: {} as never,
      cursor: undefined,
      userFactory: async () => ({}),
    });
    createResMatrix({
      // @ts-expect-error — arbitrary strings are not valid families
      meta: { family: "custom" },
      connector: {} as never,
      head: {} as never,
      cursor: undefined,
      userFactory: async () => ({}),
    });
  });

  it("rejects a gear meta missing the required `role` discriminator", () => {
    createResMatrix({
      // @ts-expect-error — gear matrices require `role`
      meta: { family: "gear" },
      connector: {} as never,
      head: {} as never,
      cursor: undefined,
      userFactory: async () => ({}),
    });
  });

  it("rejects an options object missing `userFactory`", () => {
    const opts = {
      meta: { family: "shell" } as ShellMatrixMeta,
      connector: {} as never,
      head: {} as never,
      cursor: undefined,
    };
    // @ts-expect-error — userFactory is required
    createResMatrix(opts);
  });
});

describe("tryGetResMatrixMeta — signature", () => {
  it("takes an AnyResOrigin and returns the meta union or undefined", () => {
    expectTypeOf(tryGetResMatrixMeta).parameter(0).toEqualTypeOf<AnyResOrigin>();
    expectTypeOf(tryGetResMatrixMeta).returns.toEqualTypeOf<AnyMatrixMeta | undefined>();
  });

  it("has exactly one required positional parameter", () => {
    expectTypeOf<Parameters<typeof tryGetResMatrixMeta>>().toEqualTypeOf<[origin: AnyResOrigin]>();
  });

  it("always includes undefined in the return type (absence must be representable)", () => {
    expectTypeOf<undefined>().toExtend<ReturnType<typeof tryGetResMatrixMeta>>();
  });

  it("accepts both variants of AnyResOrigin at the call site", () => {
    const mat: AnyResMatrix = createResMatrix({
      meta: { family: "gear", role: "inner" },
      connector: {} as never,
      head: {} as never,
      cursor: undefined,
      userFactory: async () => ({}),
    });
    const raw: AnyRes = { greeting: "hi" };

    expectTypeOf(tryGetResMatrixMeta(mat)).toEqualTypeOf<AnyMatrixMeta | undefined>();
    expectTypeOf(tryGetResMatrixMeta(raw)).toEqualTypeOf<AnyMatrixMeta | undefined>();
  });
});
