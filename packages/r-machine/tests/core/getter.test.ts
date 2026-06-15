import { describe, expect, it } from "vitest";
import { createGetter, isGetter } from "../../src/core/getter.js";
import { getMemberName } from "../../src/core/member-name.js";

describe("createGetter", () => {
  it("brands the function in place and returns the very same reference", () => {
    // The brand is stamped onto the passed function — no wrapper — so callers
    // keep referential identity (important for cassette dep tracking).
    const read = () => 42;
    const getter = createGetter(read, "answer");

    expect(getter).toBe(read);
    expect(getter()).toBe(42);
    expect(isGetter(getter)).toBe(true);
  });

  it("stamps the member name", () => {
    const getter = createGetter(() => 1, "subtotal");
    expect(getMemberName(getter)).toBe("subtotal");
  });
});

describe("isGetter", () => {
  it("is true only for a branded getter, false for a plain function", () => {
    expect(isGetter(createGetter(() => 1, "g"))).toBe(true);
    expect(isGetter(() => 1)).toBe(false);
  });

  it("is false for non-function values", () => {
    expect(isGetter(42)).toBe(false);
    expect(isGetter(null)).toBe(false);
    expect(isGetter(undefined)).toBe(false);
    expect(isGetter({})).toBe(false);
    expect(isGetter("getter")).toBe(false);
  });
});
