import { describe, expect, it, vi } from "vitest";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import { buildResolveEnv, outerGearModule } from "../_fixtures/build-resolve-env.js";

const LAYOUT: AnyResLayout = { "g/": "gear:outer" };

describe("ResManager.disposeResources", () => {
  it("disposes resolved slots and clears state so a re-resolve starts fresh", async () => {
    const teardown = vi.fn();
    const env = buildResolveEnv(LAYOUT, {
      "g/counter": outerGearModule((composer) => {
        // Runtime fixture — composer generics are `any` (type contracts live in
        // the *.test-d.ts suites).
        const OG = composer as any;
        return OG.withState({ n: 0 }).define((plugin: any, c: any) => ({
          value: c.getter(() => plugin.$.state.n),
          inc: c.action(() => ({ n: plugin.$.state.n + 1 })),
          [Symbol.dispose]: teardown,
        }));
      }),
    });

    const first = (await env.resolve("g/counter" as AnyNamespace)) as { value: number; inc: () => void };
    expect(first.value).toBe(0);
    first.inc();
    first.inc();
    expect(first.value).toBe(2);

    env.rm.disposeResources();
    expect(teardown).toHaveBeenCalledTimes(1);

    // Fresh cell after disposeResources — the mutated state from the first resolve is gone.
    const second = (await env.resolve("g/counter" as AnyNamespace)) as { value: number };
    expect(second.value).toBe(0);
  });

  it("is a no-op on an empty manager and is safe to call twice", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "g/x": outerGearModule((composer) => (composer as any).define(() => ({ v: 1 }))),
    });
    expect(() => env.rm.disposeResources()).not.toThrow();
    await env.resolve("g/x" as AnyNamespace);
    env.rm.disposeResources();
    expect(() => env.rm.disposeResources()).not.toThrow();
  });
});
