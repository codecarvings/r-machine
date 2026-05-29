import { describe, expect, it } from "vitest";
import { createInnerGearComposer } from "../../src/core/inner-gear-composer.js";
import { createOuterGearComposer } from "../../src/core/outer-gear-composer.js";
import { getPlugId } from "../../src/core/plug.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import { buildResolveEnv, makeConnector } from "../_fixtures/build-resolve-env.js";

const INNER_LAYOUT: AnyResLayout = { "i/": "gear:inner" };
const OUTER_LAYOUT: AnyResLayout = { "g/": "gear:outer" };

describe("ResMatrix.clone — identity", () => {
  it("clone() returns a fresh matrix with its own plug (distinct id)", () => {
    const composer = createInnerGearComposer<any, any>(makeConnector({} as never));
    const original = composer.define(() => ({ n: 1 }));
    const cloned = original.clone();

    expect(cloned).not.toBe(original);
    expect(cloned.plug).not.toBe(original.plug);
    expect(getPlugId(cloned.plug as never)).not.toBe(getPlugId(original.plug as never));
  });

  it("sibling clones are mutually independent matrices", () => {
    const composer = createInnerGearComposer<any, any>(makeConnector({} as never));
    const original = composer.define(() => ({ n: 1 }));
    const a = original.clone();
    const b = original.clone();

    expect(a).not.toBe(b);
    expect(getPlugId(a.plug as never)).not.toBe(getPlugId(b.plug as never));
  });
});

describe("ResMatrix.clone — fn transform & composition", () => {
  it("clone(fn) applies fn(res, plugin) over the original factory result; source is untouched", async () => {
    let orig: any;
    const build = (jm: any) => (orig ??= createInnerGearComposer<any, any>(makeConnector(jm)).define(() => ({ n: 1 })));
    const env = buildResolveEnv(INNER_LAYOUT, {
      "i/orig": (jm) => ({ r: build(jm) }),
      "i/clone": (jm) => ({ r: build(jm).clone((res: any) => ({ n: res.n + 10 })) }),
    });

    expect(((await env.resolve("i/clone" as AnyNamespace)) as { n: number }).n).toBe(11);
    // Source resolves to its original shape — clone did not mutate it.
    expect(((await env.resolve("i/orig" as AnyNamespace)) as { n: number }).n).toBe(1);
  });

  it("chained clones compose left-to-right: fn2(fn1(original))", async () => {
    let orig: any;
    const build = (jm: any) => (orig ??= createInnerGearComposer<any, any>(makeConnector(jm)).define(() => ({ n: 1 })));
    const env = buildResolveEnv(INNER_LAYOUT, {
      "i/chained": (jm) => ({
        r: build(jm)
          .clone((res: any) => ({ n: res.n + 1 })) // 1 -> 2
          .clone((res: any) => ({ n: res.n * 10 })), // 2 -> 20
      }),
    });

    expect(((await env.resolve("i/chained" as AnyNamespace)) as { n: number }).n).toBe(20);
  });

  it("clone(fn) accepts an async fn (runtime awaits transparently)", async () => {
    let orig: any;
    const build = (jm: any) => (orig ??= createInnerGearComposer<any, any>(makeConnector(jm)).define(() => ({ n: 2 })));
    const env = buildResolveEnv(INNER_LAYOUT, {
      "i/async": (jm) => ({ r: build(jm).clone(async (res: any) => ({ n: res.n + 5 })) }),
    });

    expect(((await env.resolve("i/async" as AnyNamespace)) as { n: number }).n).toBe(7);
  });

  it("clone(fn) receives the plugin context as its 2nd arg", async () => {
    let orig: any;
    const build = (jm: any) =>
      (orig ??= createInnerGearComposer<any, any>(makeConnector(jm))
        .withPorts({ tag: "T" })
        .define(({ $ }: any) => ({ base: $.ports.tag })));
    const env = buildResolveEnv(INNER_LAYOUT, {
      "i/withplugin": (jm) => ({
        r: build(jm).clone((res: any, plugin: any) => ({ base: `${res.base}:${plugin.$.ports.tag}` })),
      }),
    });

    expect(((await env.resolve("i/withplugin" as AnyNamespace)) as { base: string }).base).toBe("T:T");
  });
});

describe("ResMatrix.clone — withPorts (shallow merge)", () => {
  it("withPorts(overrides).clone() replaces only listed port keys", async () => {
    let orig: any;
    const build = (jm: any) =>
      (orig ??= createInnerGearComposer<any, any>(makeConnector(jm))
        .withPorts({ a: "A", b: "B" })
        .define(({ $ }: any) => ({ a: $.ports.a, b: $.ports.b })));
    const env = buildResolveEnv(INNER_LAYOUT, {
      "i/orig": (jm) => ({ r: build(jm) }),
      "i/variant": (jm) => ({ r: build(jm).withPorts({ a: "A2" }).clone() }),
    });

    const orig2 = (await env.resolve("i/orig" as AnyNamespace)) as { a: string; b: string };
    const variant = (await env.resolve("i/variant" as AnyNamespace)) as { a: string; b: string };

    expect(orig2).toEqual({ a: "A", b: "B" });
    expect(variant).toEqual({ a: "A2", b: "B" }); // only `a` replaced
  });
});

describe("ResMatrix.clone — OuterGear state", () => {
  it("withState(partial).clone() deep-merges over the original default state", async () => {
    let orig: any;
    const build = (jm: any, recorder: any) =>
      (orig ??= createOuterGearComposer<any, any>(makeConnector(jm), recorder)
        .withState({ count: 0, nested: { x: 1, y: 2 } })
        .define((plugin: any, cursor: any) => ({
          count: cursor.getter(() => plugin.$.state.count),
          x: cursor.getter(() => plugin.$.state.nested.x),
          y: cursor.getter(() => plugin.$.state.nested.y),
        })));
    const env = buildResolveEnv(OUTER_LAYOUT, {
      "g/clone": (jm, recorder) => ({
        r: build(jm, recorder)
          .withState({ nested: { x: 9 } })
          .clone(),
      }),
    });

    const res = (await env.resolve("g/clone" as AnyNamespace)) as { count: number; x: number; y: number };

    // count untouched, nested.x overridden, nested.y preserved (deep merge).
    expect(res).toMatchObject({ count: 0, x: 9, y: 2 });
  });

  it("clones own independent state cells — mutating one does not affect the other", async () => {
    let orig: any;
    const build = (jm: any, recorder: any) =>
      (orig ??= createOuterGearComposer<any, any>(makeConnector(jm), recorder)
        .withState({ count: 0 })
        .define((plugin: any, cursor: any) => ({
          read: cursor.getter(() => plugin.$.state.count),
          inc: cursor.action(() => ({ count: plugin.$.state.count + 1 })),
        })));
    const env = buildResolveEnv(OUTER_LAYOUT, {
      "g/a": (jm, recorder) => ({ r: build(jm, recorder) }),
      "g/b": (jm, recorder) => ({ r: build(jm, recorder).clone() }),
    });

    const a = (await env.resolve("g/a" as AnyNamespace)) as { read: number; inc: () => void };
    const b = (await env.resolve("g/b" as AnyNamespace)) as { read: number; inc: () => void };

    a.inc();
    a.inc();
    expect(a.read).toBe(2);
    expect(b.read).toBe(0); // isolated
  });
});
