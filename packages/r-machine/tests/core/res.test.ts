import { describe, expect, it, vi } from "vitest";
import { type AnyRes, tryGetDispose } from "../../src/core/res.js";
import { ERR_ASYNC_DISPOSE_NOT_SUPPORTED, RMachineUsageError } from "../../src/errors/index.js";

describe("tryGetDispose", () => {
  it("returns the function when [Symbol.dispose] is present", () => {
    const dispose = vi.fn();
    const res = { value: 1, [Symbol.dispose]: dispose } as unknown as AnyRes;

    const got = tryGetDispose(res);

    expect(got).toBe(dispose);
  });

  it("returns undefined when neither [Symbol.dispose] nor [Symbol.asyncDispose] is present", () => {
    const res = { value: 1 } as unknown as AnyRes;

    expect(tryGetDispose(res)).toBeUndefined();
  });

  it("throws RMachineUsageError(ERR_ASYNC_DISPOSE_NOT_SUPPORTED) when [Symbol.asyncDispose] is present", () => {
    const res = { value: 1, [Symbol.asyncDispose]: async () => {} } as unknown as AnyRes;

    try {
      tryGetDispose(res);
      expect.unreachable("tryGetDispose should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(RMachineUsageError);
      expect((e as RMachineUsageError).code).toBe(ERR_ASYNC_DISPOSE_NOT_SUPPORTED);
    }
  });

  it("throws on [Symbol.asyncDispose] even if [Symbol.dispose] is also present", () => {
    const res = {
      value: 1,
      [Symbol.dispose]: () => {},
      [Symbol.asyncDispose]: async () => {},
    } as unknown as AnyRes;

    try {
      tryGetDispose(res);
      expect.unreachable("tryGetDispose should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(RMachineUsageError);
      expect((e as RMachineUsageError).code).toBe(ERR_ASYNC_DISPOSE_NOT_SUPPORTED);
    }
  });
});
