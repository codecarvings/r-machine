import { describe, expectTypeOf, it } from "vitest";
import type { AnyOuterGear, RejectAsyncValueProps } from "../../src/core/outer-gear.js";

// outer-gear.ts is 100% type-level. The one contract worth pinning is
// RejectAsyncValueProps: the rule that an OuterGear may expose async *actions*
// (`(...) => Promise<void>`) but never async *values* (`(...) => Promise<T>`),
// because a value getter must be synchronous on the reactive surface. This is
// what makes `define(...)` reject an async getter at compile time.

describe("RejectAsyncValueProps", () => {
  it("keeps sync values, sync getters, and async actions (Promise<void>) untouched", () => {
    type Resource = {
      count: number;
      label: () => string;
      reset: () => Promise<void>;
      setName: (name: string) => Promise<void>;
    };
    type Kept = RejectAsyncValueProps<Resource>;

    expectTypeOf<Kept["count"]>().toEqualTypeOf<number>();
    expectTypeOf<Kept["label"]>().toEqualTypeOf<() => string>();
    expectTypeOf<Kept["reset"]>().toEqualTypeOf<() => Promise<void>>();
    expectTypeOf<Kept["setName"]>().toEqualTypeOf<(name: string) => Promise<void>>();
  });

  it("maps an async value prop (Promise<non-void>) to never", () => {
    type Resource = { fetchTotal: () => Promise<number> };

    expectTypeOf<RejectAsyncValueProps<Resource>["fetchTotal"]>().toEqualTypeOf<never>();
  });

  it("a resource with an async value prop is not assignable to its rejected shape", () => {
    type Resource = { ok: () => Promise<void>; bad: () => Promise<number> };

    // `bad` collapses to `never`, so the original resource can no longer satisfy
    // the rejected shape — exactly the assignability failure `define` surfaces.
    expectTypeOf<Resource>().not.toExtend<RejectAsyncValueProps<Resource>>();
  });
});

describe("AnyOuterGear", () => {
  it("accepts an object of getters and actions as items", () => {
    expectTypeOf<{ read: () => number; inc: () => void }>().toExtend<AnyOuterGear>();
  });
});
