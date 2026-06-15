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

  it("map deps + withPorts → both `named` deps and `$.ports.*` are available", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/config": baseGearModule((c) => c.define(() => ({ apiBase: "base" }))),
      "b/svc": baseGearModule((c) =>
        (c.withDeps as any)({ cfg: "b/config" })
          .withPorts({ tag: () => "P" })
          .define(({ cfg, $ }: any) => ({ url: cfg.apiBase, tag: $.ports.tag() }))
      ),
    });

    expect(await env.resolve("b/svc" as AnyNamespace)).toEqual({ url: "base", tag: "P" });
  });

  it("list deps + withPorts → positional deps and `$.ports.*` together", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/config": baseGearModule((c) => c.define(() => ({ apiBase: "base" }))),
      "b/svc": baseGearModule((c) =>
        (c.withDeps as any)("b/config")
          .withPorts({ tag: () => "Q" })
          .define(([cfg, $]: any) => ({ url: cfg.apiBase, tag: $.ports.tag() }))
      ),
    });

    expect(await env.resolve("b/svc" as AnyNamespace)).toEqual({ url: "base", tag: "Q" });
  });
});

describe("BaseGear composer — clone() and port overrides", () => {
  it("clone() with no transform → resource identical to the source factory", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/c": baseGearModule((c) => (c.define(() => ({ n: 1 })) as any).clone()),
    });

    expect(await env.resolve("b/c" as AnyNamespace)).toEqual({ n: 1 });
  });

  it("clone(fn) → transform runs over the awaited base factory output", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/c": baseGearModule((c) => (c.define(() => ({ n: 1 })) as any).clone((res: any) => ({ n: res.n + 10 }))),
    });

    expect(await env.resolve("b/c" as AnyNamespace)).toEqual({ n: 11 });
  });

  it("withPorts(overrides).clone() → overridden port value wins at resolution", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/c": baseGearModule((c) =>
        ((c.withPorts as any)({ v: () => 1 }).define(({ $ }: any) => ({ v: $.ports.v() })) as any)
          .withPorts({ v: () => 9 })
          .clone()
      ),
    });

    expect(await env.resolve("b/c" as AnyNamespace)).toEqual({ v: 9 });
  });

  it("list matrix: clone(fn) transforms the positional-form output", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/config": baseGearModule((c) => c.define(() => ({ apiBase: "base" }))),
      "b/c": baseGearModule((c) =>
        ((c.withDeps as any)("b/config").define(([cfg]: any) => ({ n: cfg.apiBase.length })) as any).clone(
          (res: any) => ({ n: res.n + 5 })
        )
      ),
    });

    expect(await env.resolve("b/c" as AnyNamespace)).toEqual({ n: 9 });
  });

  it("list matrix: withPorts(overrides).clone() applies the override", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "b/config": baseGearModule((c) => c.define(() => ({ apiBase: "base" }))),
      "b/c": baseGearModule((c) =>
        ((c.withDeps as any)("b/config")
          .withPorts({ v: () => 1 })
          .define(([_cfg, $]: any) => ({ v: $.ports.v() })) as any)
          .withPorts({ v: () => 8 })
          .clone()
      ),
    });

    expect(await env.resolve("b/c" as AnyNamespace)).toEqual({ v: 8 });
  });
});
