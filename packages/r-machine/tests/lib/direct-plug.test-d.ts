import { describe, expectTypeOf, it } from "vitest";
import type { AnyResModule } from "../../src/core/res-module.js";
import { defineLayout } from "../../src/lib/layout.js";
import { RMachine } from "../../src/lib/r-machine.js";

// A representative atlas spanning every resource kind so we can prove the
// DirectPlug dep scope (`valid@direct` = base gears + shells) at the type
// level: shells/base gears are accepted, inner/outer gears are rejected.
const folders = defineLayout({
  "inner/": "gear:inner",
  "base/": "gear:base",
  "outer/": "gear:outer",
  "shell/": "shell",
});

type ResourceMap = {
  "inner/double": { double: (n: number) => number };
  "base/cfg": { url: string };
  "outer/counter": { value: number };
  "shell/greeting": { text: string };
};

class ResourceAtlas extends folders<ResourceMap>() {}

ResourceAtlas.loader.register(["*"], async () => ({ r: {} }) as unknown as AnyResModule);

// No directKit → `$.kit` is absent from the context.
const plain = RMachine.create({
  instanceName: "direct-typetest-plain",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  experimental: { outerGear: "on" },
}).createToolset();

// With directKit → `$.kit` is present and typed from the kit map.
const kitted = RMachine.create({
  instanceName: "direct-typetest-kitted",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  directKit: { cfg: "base/cfg" },
  experimental: { outerGear: "on" },
}).createToolset();

type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer C] ? C : never;
type First<T extends readonly unknown[]> = T extends readonly [infer S, ...unknown[]] ? S : never;

describe("DirectPlug — dependency scope", () => {
  it("accepts shells and base gears as deps", () => {
    expectTypeOf(plain.DirectPlug).toBeFunction();
    plain.DirectPlug("shell/greeting");
    plain.DirectPlug("base/cfg");
    plain.DirectPlug("shell/greeting", "base/cfg");
    plain.DirectPlug({ tpl: "shell/greeting", cfg: "base/cfg" });
  });

  it("rejects inner gears (container-bound, not pure functions of locale)", () => {
    // @ts-expect-error inner gears are outside `valid@direct`
    plain.DirectPlug("inner/double");
  });

  it("rejects outer gears (stateful — require a container)", () => {
    // @ts-expect-error outer gears are outside `valid@direct`
    plain.DirectPlug("outer/counter");
  });
});

describe("DirectPlug — resolved shape", () => {
  it("useR(locale) is async and returns the uniform [s, $] tuple", async () => {
    const plug = plain.DirectPlug("shell/greeting");
    expectTypeOf(plug.useR).toBeFunction();

    type Resolved = Awaited<ReturnType<typeof plug.useR>>;
    // First element: the resolved shell surface.
    expectTypeOf<First<Resolved>>().toExtend<{ text: string }>();
    // Last element ($): a readonly locale echo, no setLocale/getPath.
    expectTypeOf<Last<Resolved>>().toHaveProperty("locale");
    expectTypeOf<Last<Resolved>>().not.toHaveProperty("setLocale");
    expectTypeOf<Last<Resolved>>().not.toHaveProperty("kit");
  });

  it("exposes a typed $.kit when an directKit is configured", async () => {
    const plug = kitted.DirectPlug("shell/greeting");
    type Resolved = Awaited<ReturnType<typeof plug.useR>>;
    type Ctx = Last<Resolved>;
    expectTypeOf<Ctx>().toHaveProperty("kit");
    expectTypeOf<Ctx>().toHaveProperty("locale");
  });
});
