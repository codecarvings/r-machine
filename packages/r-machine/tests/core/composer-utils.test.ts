import { describe, expect, it, vi } from "vitest";
import { lazyGetters } from "../../src/core/composer-utils.js";

describe("lazyGetters", () => {
  it("computes each property lazily on first access and caches the result", () => {
    const factory = vi.fn(() => "value");
    const obj = lazyGetters<{ a: string }>({ a: factory });

    // Lazy: nothing runs at construction.
    expect(factory).not.toHaveBeenCalled();

    expect(obj.a).toBe("value");
    expect(factory).toHaveBeenCalledTimes(1);

    // Second access returns the cached value without re-invoking the factory.
    expect(obj.a).toBe("value");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("exposes the properties as enumerable own keys", () => {
    const obj = lazyGetters<{ a: number; b: number }>({ a: () => 1, b: () => 2 });
    expect(Object.keys(obj)).toEqual(["a", "b"]);
  });

  it("computes each property independently from its own factory", () => {
    const obj = lazyGetters<{ a: number; b: string }>({ a: () => 7, b: () => "x" });
    expect(obj.a).toBe(7);
    expect(obj.b).toBe("x");
  });
});
