import { describe, expect, it } from "vitest";
import { EmptyFmtProviderCtor } from "../../src/lib/fmt.js";

describe("EmptyFmtProviderCtor", () => {
  it("static .get() returns an empty object", () => {
    expect(EmptyFmtProviderCtor.get("en")).toEqual({});
  });

  it("instance .get() returns the same object as static .get()", () => {
    const instance = new EmptyFmtProviderCtor();
    expect(instance.get("en")).toBe(EmptyFmtProviderCtor.get("en"));
  });

  it("returns the same frozen reference for any locale", () => {
    const a = EmptyFmtProviderCtor.get("en");
    const b = EmptyFmtProviderCtor.get("it");
    const c = EmptyFmtProviderCtor.get("fr");
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(Object.isFrozen(a)).toBe(true);
  });
});
