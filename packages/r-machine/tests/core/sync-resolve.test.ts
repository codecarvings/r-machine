import { describe, expect, it } from "vitest";
import { ASYNC, fulfilledThenable } from "../../src/core/sync-resolve.js";

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
