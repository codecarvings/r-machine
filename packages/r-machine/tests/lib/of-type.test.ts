import { describe, expect, it } from "vitest";
import { ofType } from "../../src/lib/of-type.js";

describe("ofType", () => {
  // ofType is a type-level helper: its real contract lives in of-type.test-d.ts.
  // The only runtime invariant worth pinning is that it is a zero-cost
  // no-op — it must never allocate, introspect, or leak the phantom value.
  it("is a zero-cost runtime no-op that returns undefined", () => {
    expect(ofType<{ greeting: string }>()).toBeUndefined();
  });

  it("ignores the type parameter at runtime (same return for any T)", () => {
    // Different T, same runtime value — proves the generic is erased.
    const a = ofType<number>();
    const b = ofType<{ complex: { nested: boolean } }>();
    expect(a).toBe(b);
    expect(a).toBeUndefined();
  });
});
