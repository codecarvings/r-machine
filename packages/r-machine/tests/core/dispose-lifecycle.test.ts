import { describe, expect, it, vi } from "vitest";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import { ERR_ASYNC_DISPOSE_NOT_SUPPORTED, RMachineUsageError } from "../../src/errors/index.js";
import { buildResolveEnv, innerGearModule } from "../_fixtures/build-resolve-env.js";

const LAYOUT: AnyResLayout = { "b/": "gear:base", "i/": "gear:inner" };

// Integration-level `[Symbol.dispose]` contract from a consumer's perspective.
// (The per-slot disposal mechanics — order, vertex slots — live in
// pod-manager.test.ts; the `tryGetDispose` unit lives in res.test.ts.)

describe("dispose lifecycle — through resolve + invalidate", () => {
  it("teardown runs exactly once on invalidate, and not again on a second invalidate", async () => {
    const teardown = vi.fn();
    const env = buildResolveEnv(LAYOUT, {
      "b/x": () => ({ r: { x: 1, [Symbol.dispose]: teardown } as never }),
    });

    await env.resolve("b/x" as AnyNamespace);
    env.rm.invalidate("b/x" as AnyNamespace);
    expect(teardown).toHaveBeenCalledTimes(1);

    // Slot already evicted → second invalidate finds nothing to dispose.
    env.rm.invalidate("b/x" as AnyNamespace);
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it("a factory that throws before returning leaves no slot to tear down", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "i/boom": innerGearModule((c) =>
        c.define(() => {
          throw new Error("boom");
        })
      ),
    });

    await expect(env.resolve("i/boom" as AnyNamespace)).rejects.toThrow("boom");
    // Nothing committed → invalidate is a safe no-op.
    expect(() => env.rm.invalidate("i/boom" as AnyNamespace)).not.toThrow();
  });

  it("a resource exposing [Symbol.asyncDispose] is rejected at disposal time", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/async": () => ({ r: { x: 1, [Symbol.asyncDispose]: async () => {} } as never }),
    });

    await env.resolve("b/async" as AnyNamespace);
    try {
      env.rm.invalidate("b/async" as AnyNamespace);
      expect.unreachable("invalidate should throw on async-only dispose");
    } catch (err) {
      expect(err).toBeInstanceOf(RMachineUsageError);
      expect((err as RMachineUsageError).code).toBe(ERR_ASYNC_DISPOSE_NOT_SUPPORTED);
    }
  });
});
