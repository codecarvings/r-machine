import { describe, expect, it, vi } from "vitest";
import { dispose } from "../../src/lib/dispose.js";

describe("dispose", () => {
  it("invokes the resource's [Symbol.dispose]() method", () => {
    const spy = vi.fn();
    const res: Disposable = { [Symbol.dispose]: spy };

    dispose(res);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("calls [Symbol.dispose] with the resource as `this`", () => {
    let thisArg: unknown;
    const res: Disposable = {
      [Symbol.dispose]() {
        thisArg = this;
      },
    };

    dispose(res);

    expect(thisArg).toBe(res);
  });

  it("returns undefined", () => {
    const res: Disposable = { [Symbol.dispose]: () => {} };

    expect(dispose(res)).toBeUndefined();
  });

  it("propagates errors thrown by [Symbol.dispose]", () => {
    const boom = new Error("disposal failed");
    const res: Disposable = {
      [Symbol.dispose]() {
        throw boom;
      },
    };

    try {
      dispose(res);
      expect.unreachable("dispose should rethrow the disposer error");
    } catch (err) {
      expect(err).toBe(boom);
    }
  });

  it("does not swallow repeated disposal — each call re-invokes the method", () => {
    const spy = vi.fn();
    const res: Disposable = { [Symbol.dispose]: spy };

    dispose(res);
    dispose(res);

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
