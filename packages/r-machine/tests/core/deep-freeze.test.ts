import { describe, expect, it } from "vitest";
import { deepFreeze } from "../../src/core/deep-freeze.js";

describe("deepFreeze", () => {
  it("freezes a plain object in place and returns the same reference", () => {
    const obj = { count: 1 };
    const out = deepFreeze(obj);

    expect(out).toBe(obj);
    expect(Object.isFrozen(obj)).toBe(true);
  });

  it("freezes nested plain objects (deep, not shallow)", () => {
    const state = { user: { name: "ada", roles: { admin: true } } };
    deepFreeze(state);

    expect(Object.isFrozen(state.user)).toBe(true);
    expect(Object.isFrozen(state.user.roles)).toBe(true);
  });

  it("freezes arrays and their elements", () => {
    const state = { lines: [{ qty: 1 }, { qty: 2 }] };
    deepFreeze(state);

    expect(Object.isFrozen(state.lines)).toBe(true);
    expect(Object.isFrozen(state.lines[0])).toBe(true);
  });

  it("a frozen value rejects in-place mutation (strict mode)", () => {
    const state = deepFreeze({ count: 1, nested: { x: 0 }, list: [1] });

    expect(() => {
      (state as { count: number }).count = 2;
    }).toThrow(TypeError);
    expect(() => {
      (state.nested as { x: number }).x = 9;
    }).toThrow(TypeError);
    expect(() => {
      (state.list as number[]).push(2);
    }).toThrow(TypeError);
  });

  it("leaves atomics/exotics untouched (Date, Map, class instance)", () => {
    class Box {
      value = 1;
    }
    const date = new Date(0);
    const map = new Map<string, number>();
    const box = new Box();
    const state = { date, map, box };

    deepFreeze(state);

    // The container is frozen, but opaque members are not (freezing a Map would
    // not stop `.set`, and freezing a class instance could break it).
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(date)).toBe(false);
    expect(Object.isFrozen(map)).toBe(false);
    expect(Object.isFrozen(box)).toBe(false);
    // They still work.
    expect(() => map.set("a", 1)).not.toThrow();
    expect(() => {
      box.value = 2;
    }).not.toThrow();
  });

  it("short-circuits an already-frozen value (idempotent)", () => {
    const state = { a: { b: 1 } };
    deepFreeze(state);
    // Second call must not throw and must keep the same frozen graph.
    expect(() => deepFreeze(state)).not.toThrow();
    expect(Object.isFrozen(state.a)).toBe(true);
  });

  it("passes primitives through unchanged", () => {
    expect(deepFreeze(42)).toBe(42);
    expect(deepFreeze("x")).toBe("x");
    expect(deepFreeze(null)).toBe(null);
    expect(deepFreeze(undefined)).toBe(undefined);
  });
});
