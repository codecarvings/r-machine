import { describe, expect, expectTypeOf, it } from "vitest";
import { Comparer, type EqualsStrategy, resolveEquals } from "../../src/core/comparer.js";

describe("Comparer namespace", () => {
  it("exposes exactly the built-in strategies identity and shallow", () => {
    expect(Object.keys(Comparer).sort()).toEqual(["identity", "shallow"]);
  });

  it("EqualsStrategy is the union of the namespace keys", () => {
    expectTypeOf<EqualsStrategy>().toEqualTypeOf<"identity" | "shallow">();
  });
});

describe("Comparer.identity (Object.is)", () => {
  it("is Object.is", () => {
    expect(Comparer.identity).toBe(Object.is);
  });

  it("true for the same reference, false for distinct field-equal objects", () => {
    const ref = { n: 1 };
    expect(Comparer.identity(ref, ref)).toBe(true);
    expect(Comparer.identity({ n: 1 }, { n: 1 })).toBe(false);
  });

  it("Object.is semantics for NaN and signed zero", () => {
    expect(Comparer.identity(Number.NaN, Number.NaN)).toBe(true);
    expect(Comparer.identity(0, -0)).toBe(false);
  });
});

describe("Comparer.shallow", () => {
  const { shallow } = Comparer;

  it("short-circuits on identical references", () => {
    const ref = { a: 1 };
    expect(shallow(ref, ref)).toBe(true);
  });

  it("compares primitives via Object.is", () => {
    expect(shallow(1, 1)).toBe(true);
    expect(shallow(1, 2)).toBe(false);
    expect(shallow("x", "x")).toBe(true);
    expect(shallow(Number.NaN, Number.NaN)).toBe(true);
    expect(shallow(0, -0)).toBe(false);
  });

  it("a primitive and an object are never equal", () => {
    expect(shallow(1, { valueOf: () => 1 })).toBe(false);
    expect(shallow({}, 1)).toBe(false);
  });

  it("null is only equal to null", () => {
    expect(shallow(null, null)).toBe(true);
    expect(shallow(null, {})).toBe(false);
    expect(shallow({}, null)).toBe(false);
  });

  it("true for distinct objects with identical first-level keys and values", () => {
    expect(shallow({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
  });

  it("false when a value differs", () => {
    expect(shallow({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it("false when key counts differ", () => {
    expect(shallow({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("false when keys differ but counts match (hasOwn check)", () => {
    expect(shallow({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("distinguishes an explicit undefined value from a missing key of equal arity", () => {
    expect(shallow({ a: undefined }, { b: undefined })).toBe(false);
  });

  it("treats an explicitly-undefined key as a real key", () => {
    expect(shallow({ a: undefined }, { a: undefined })).toBe(true);
  });

  it("compares NaN-valued fields via Object.is", () => {
    expect(shallow({ a: Number.NaN }, { a: Number.NaN })).toBe(true);
  });

  it("only goes one level deep: nested objects compared by reference", () => {
    expect(shallow({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
    const nested = { x: 1 };
    expect(shallow({ a: nested }, { a: nested })).toBe(true);
  });

  it("compares arrays element-wise", () => {
    expect(shallow([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(shallow([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(shallow([1, 2], [1, 2, 3])).toBe(false);
  });

  it("an array and an object never compare equal, even when empty", () => {
    expect(shallow([], {})).toBe(false);
    expect(shallow({}, [])).toBe(false);
  });
});

describe("resolveEquals", () => {
  it("undefined resolves to identity (Object.is)", () => {
    expect(resolveEquals(undefined)).toBe(Comparer.identity);
  });

  it("'identity' resolves to the identity comparator", () => {
    expect(resolveEquals("identity")).toBe(Comparer.identity);
  });

  it("'shallow' resolves to the shallow comparator", () => {
    expect(resolveEquals("shallow")).toBe(Comparer.shallow);
  });

  it("a custom function resolves to itself", () => {
    const custom = (_a: unknown, _b: unknown) => true;
    expect(resolveEquals(custom)).toBe(custom);
  });
});
