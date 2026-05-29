import { describe, expect, it, vi } from "vitest";
import { createBaseGearComposer } from "../../src/core/base-gear-composer.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import { tryGetResMatrixMeta } from "../../src/core/res-matrix.js";
import { baseGearModule, buildResolveEnv, makeConnector } from "../_fixtures/build-resolve-env.js";

const LAYOUT: AnyResLayout = { "b/": "gear:base" };

describe("BaseGear composer — construction", () => {
  it("define() returns a ResMatrix tagged family=gear role=base without invoking the factory", () => {
    const composer = createBaseGearComposer<any, any>(makeConnector({} as never));
    const factory = vi.fn(() => ({ value: 1 }));

    const matrix = composer.define(factory);

    expect(factory).not.toHaveBeenCalled();
    expect(typeof matrix.create).toBe("function");
    expect(matrix.plug).toBeDefined();
    expect(tryGetResMatrixMeta(matrix as never)).toEqual({ family: "gear", role: "base" });
  });
});

describe("BaseGear composer — resolution through the full stack", () => {
  it("no deps → factory receives map-form `{ $ }`", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/config": baseGearModule((c) => c.define(() => ({ apiBase: "base" }))),
    });

    const res = (await env.resolve("b/config" as AnyNamespace)) as { apiBase: string };

    expect(res.apiBase).toBe("base");
  });

  it("map deps → factory receives `{ named, $ }`; list deps → `[...deps, $]`", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/config": baseGearModule((c) => c.define(() => ({ apiBase: "base" }))),
      "b/mapdep": baseGearModule((c) =>
        (c.withDeps as any)({ cfg: "b/config" }).define(({ cfg }: any) => ({ url: `${cfg.apiBase}/m` }))
      ),
      "b/listdep": baseGearModule((c) =>
        (c.withDeps as any)("b/config").define(([cfg]: any) => ({ url: `${cfg.apiBase}/l` }))
      ),
    });

    expect(((await env.resolve("b/mapdep" as AnyNamespace)) as { url: string }).url).toBe("base/m");
    expect(((await env.resolve("b/listdep" as AnyNamespace)) as { url: string }).url).toBe("base/l");
  });

  it("withPorts({...}) → values reachable via `$.ports.*`", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/svc": baseGearModule((c) =>
        (c.withPorts as any)({ now: () => 42 }).define(({ $ }: any) => ({ ts: $.ports.now() }))
      ),
    });

    expect(((await env.resolve("b/svc" as AnyNamespace)) as { ts: number }).ts).toBe(42);
  });

  it("base gear is consumable as a dep by another base gear", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/a": baseGearModule((c) => c.define(() => ({ n: 2 }))),
      "b/b": baseGearModule((c) => (c.withDeps as any)("b/a").define(([a]: any) => ({ doubled: a.n * 2 }))),
    });

    expect(((await env.resolve("b/b" as AnyNamespace)) as { doubled: number }).doubled).toBe(4);
  });
});
