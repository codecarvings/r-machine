import { describe, expect, it, vi } from "vitest";
import { createInnerGearComposer } from "../../src/core/inner-gear-composer.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import { tryGetResMatrixMeta } from "../../src/core/res-matrix.js";
import { buildResolveEnv, innerGearModule, makeConnector } from "../_fixtures/build-resolve-env.js";

const LAYOUT: AnyResLayout = { "i/": "gear:inner" };

describe("InnerGear composer — construction", () => {
  it("define() returns a ResMatrix (create + plug) without invoking the factory", () => {
    const composer = createInnerGearComposer<any, any>(makeConnector({} as never));
    const factory = vi.fn(() => ({ value: 1 }));

    const matrix = composer.define(factory);

    expect(factory).not.toHaveBeenCalled();
    expect(typeof matrix.create).toBe("function");
    expect(matrix.plug).toBeDefined();
    // meta retrievable via the internal-key accessor; family/role pinned to inner.
    expect(tryGetResMatrixMeta(matrix as never)).toEqual({ family: "gear", role: "inner" });
  });

  it("each define() produces a distinct matrix with its own plug", () => {
    const composer = createInnerGearComposer<any, any>(makeConnector({} as never));
    const a = composer.define(() => ({}));
    const b = composer.define(() => ({}));

    expect(a).not.toBe(b);
    expect(a.plug).not.toBe(b.plug);
  });
});

describe("InnerGear composer — resolution through the full stack", () => {
  it("no deps → factory receives map-form `{ $ }`; surface exposes the returned shape", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "i/config": innerGearModule((c) =>
        c.define(({ $ }: any) => ({ apiBase: "https://x", hasDollar: $ !== undefined }))
      ),
    });

    const res = (await env.resolve("i/config" as AnyNamespace)) as { apiBase: string; hasDollar: boolean };

    expect(res.apiBase).toBe("https://x");
    expect(res.hasDollar).toBe(true);
  });

  it("map deps → factory receives `{ named, $ }`", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "i/config": innerGearModule((c) => c.define(() => ({ apiBase: "base" }))),
      "i/client": innerGearModule((c) =>
        (c.withDeps as any)({ cfg: "i/config" }).define(({ cfg, $ }: any) => ({
          url: `${cfg.apiBase}/v1`,
          hasDollar: $ !== undefined,
        }))
      ),
    });

    const res = (await env.resolve("i/client" as AnyNamespace)) as { url: string; hasDollar: boolean };

    expect(res.url).toBe("base/v1");
    expect(res.hasDollar).toBe(true);
  });

  it("list deps → factory receives positional `[...deps, $]`", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "i/config": innerGearModule((c) => c.define(() => ({ apiBase: "base" }))),
      "i/client": innerGearModule((c) =>
        (c.withDeps as any)("i/config").define(([cfg, $]: any) => ({
          url: `${cfg.apiBase}/list`,
          hasDollar: $ !== undefined,
        }))
      ),
    });

    const res = (await env.resolve("i/client" as AnyNamespace)) as { url: string; hasDollar: boolean };

    expect(res.url).toBe("base/list");
    expect(res.hasDollar).toBe(true);
  });

  it("withPorts({...}) → values reachable via `$.ports.*`", async () => {
    const greet = (name: string) => `hi ${name}`;
    const env = buildResolveEnv(LAYOUT, {
      "i/svc": innerGearModule((c) =>
        (c.withPorts as any)({ greet }).define(({ $ }: any) => ({ message: $.ports.greet("sergio") }))
      ),
    });

    const res = (await env.resolve("i/svc" as AnyNamespace)) as { message: string };

    expect(res.message).toBe("hi sergio");
  });

  it("kit entries are reachable via `$.kit.*` (and hoisted to top level in map form)", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "i/config": innerGearModule((c) => c.define(() => ({ apiBase: "kitted" }))),
      "i/consumer": innerGearModule(
        (c) => c.define(({ cfg, $ }: any) => ({ viaKit: $.kit.cfg.apiBase, viaHoist: cfg.apiBase })),
        // kit map mirrors equipment.gearKit; same wiring RMachine uses.
        { cfg: "i/config" as AnyNamespace }
      ),
    });

    const res = (await env.resolve("i/consumer" as AnyNamespace)) as { viaKit: string; viaHoist: string };

    expect(res.viaKit).toBe("kitted");
    expect(res.viaHoist).toBe("kitted");
  });
});
