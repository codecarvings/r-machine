import { describe, expect, it } from "vitest";
import { ASYNC, fulfilledThenable, isThenable } from "../../src/core/sync-resolve.js";

describe("sync-resolve — ASYNC sentinel", () => {
  it("is a stable symbol (identity holds across reads)", () => {
    expect(typeof ASYNC).toBe("symbol");
    expect(ASYNC).toBe(ASYNC);
  });

  it("can never collide with a resolved plugin value", () => {
    // A resolved plugin can be any value (object, array, even falsy). The
    // sentinel is a unique symbol, so an equality check unambiguously
    // distinguishes "decline" from any real value.
    for (const value of [undefined, null, 0, "", false, {}, [], Symbol("other")]) {
      expect(value).not.toBe(ASYNC);
    }
  });
});

describe("sync-resolve — fulfilledThenable", () => {
  it("tags the promise the way React 19 use() reads synchronously", () => {
    const value = { plugin: 1 };
    const t = fulfilledThenable(value) as Promise<unknown> & { status: string; value: unknown };
    expect(t.status).toBe("fulfilled");
    expect(t.value).toBe(value);
  });

  it("remains a genuine awaitable resolving to the same value", async () => {
    const value = { plugin: 2 };
    const t = fulfilledThenable(value);
    await expect(t).resolves.toBe(value);
  });

  it("carries primitive and falsy values intact", async () => {
    for (const value of [undefined, null, 0, "", false]) {
      const t = fulfilledThenable(value) as Promise<unknown> & { status: string; value: unknown };
      expect(t.status).toBe("fulfilled");
      expect(t.value).toBe(value);
      await expect(t).resolves.toBe(value);
    }
  });
});

describe("sync-resolve — isThenable", () => {
  it("is true for a Promise and for a custom object thenable", () => {
    expect(isThenable(Promise.resolve())).toBe(true);
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable under test
    const objThenable = { then: () => {} };
    expect(isThenable(objThenable)).toBe(true);
  });

  it("is true for a function that carries a `then` method", () => {
    // A thenable can be a function (not just an object) — covers that branch.
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable under test
    const fnThenable = Object.assign(() => {}, { then: () => {} });
    expect(isThenable(fnThenable)).toBe(true);
  });

  it("is false for null, plain objects, plain functions, and primitives", () => {
    expect(isThenable(null)).toBe(false);
    expect(isThenable(undefined)).toBe(false);
    expect(isThenable({})).toBe(false);
    expect(isThenable(() => {})).toBe(false);
    expect(isThenable(42)).toBe(false);
    expect(isThenable("then")).toBe(false);
  });
});
