import { describe, expect, it } from "vitest";
import { deepPartialMerge, isPlainObject } from "../../src/core/deep-partial.js";

describe("deepPartialMerge", () => {
  it("returns prev reference unchanged when partial is undefined", () => {
    const prev = { a: 1 };
    expect(deepPartialMerge(prev, undefined)).toBe(prev);
  });

  it("merges top-level keys, leaving untouched keys identical", () => {
    const prev = { a: 1, b: 2 };
    const next = deepPartialMerge(prev, { a: 9 });
    expect(next).toEqual({ a: 9, b: 2 });
  });

  it("recurses into plain nested objects", () => {
    const prev = { user: { name: "a", age: 30 } };
    const next = deepPartialMerge(prev, { user: { age: 31 } });
    expect(next).toEqual({ user: { name: "a", age: 31 } });
  });

  it("replaces arrays (no array-element merge)", () => {
    const prev = { items: [1, 2, 3] };
    const next = deepPartialMerge(prev, { items: [9] });
    expect(next.items).toEqual([9]);
  });

  it("an empty object partial removes nothing and keeps the prev reference", () => {
    const prev = { byId: { a: 1, b: 2 } };
    expect(deepPartialMerge(prev, {})).toBe(prev);
    expect(deepPartialMerge(prev, { byId: {} })).toBe(prev);
  });

  it("writes the partial as-is where prev holds no plain object (missing key, null)", () => {
    type Item = { name: string; qty: number };
    const prev = { byId: { a: { name: "x", qty: 2 } } as Record<string, Item>, selected: null as Item | null };
    const next = deepPartialMerge(prev, { byId: { b: { qty: 1 } }, selected: { qty: 1 } });
    // Not completed from anywhere: the fragment lands verbatim, `name` absent.
    expect(next.byId.b).toStrictEqual({ qty: 1 });
    expect(next.selected).toStrictEqual({ qty: 1 });
  });

  it("treats Date as atomic — replaces, does not recurse", () => {
    const d1 = new Date(1000);
    const d2 = new Date(2000);
    const next = deepPartialMerge({ ts: d1 }, { ts: d2 });
    expect(next.ts).toBe(d2);
  });

  it("structural sharing: returns prev when no change is detected", () => {
    const prev = { a: { x: 1 }, b: 2 };
    const next = deepPartialMerge(prev, { a: { x: 1 } });
    expect(next).toBe(prev);
  });

  it("structural sharing: untouched sub-tree keeps its reference", () => {
    const inner = { y: 1 };
    const prev = { a: inner, b: 2 };
    const next = deepPartialMerge(prev, { b: 9 });
    expect(next.a).toBe(inner);
  });

  it("ignores `undefined` values in the partial (does not overwrite)", () => {
    const prev = { a: 1, b: 2 };
    const next = deepPartialMerge(prev, { a: undefined } as unknown as { a?: number });
    expect(next.a).toBe(1);
  });

  it("non-object partial against object prev returns the partial as-is", () => {
    expect(deepPartialMerge({ a: 1 } as unknown, 42)).toBe(42);
  });
});

describe("isPlainObject — null-prototype objects", () => {
  it("treats a null-prototype object as plain, so the merge recurses into it", () => {
    expect(isPlainObject(Object.create(null))).toBe(true);

    // End-to-end: a null-proto prev is recursed into, not replaced wholesale.
    const prev = Object.assign(Object.create(null), { a: 1, b: 2 });
    const next = deepPartialMerge(prev, { a: 9 } as Partial<typeof prev>);
    expect(next).toEqual({ a: 9, b: 2 });
  });
});
