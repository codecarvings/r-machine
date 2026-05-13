import { describe, expect, it } from "vitest";
import { deepPartialMerge } from "../../../src/core/reactivity/deep-partial-merge.js";

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
