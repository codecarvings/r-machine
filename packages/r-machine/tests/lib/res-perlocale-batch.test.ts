import { describe, expect, it } from "vitest";
import type { AnyResModule } from "../../src/core/res-module.js";
import { defineLayout } from "../../src/lib/layout.js";
import { RMachine } from "../../src/lib/r-machine.js";

// Resolution-time batch helpers on `res.perLocale`, exercised from inside a
// factory over already-resolved loaders:
//   - `pickAll(loader | map)` → EVERY configured locale, locale-major.
//   - `pick(locale, map | tuple)` → ONE locale, shape preserved.
const folders = defineLayout({
  "base/": "gear:base",
  "shell/": "shell",
});

type ResourceMap = {
  "shell/greet": { greeting: string; extra: string };
  "shell/footer": { note: string };
};

class ResourceAtlas extends folders<ResourceMap>() {}
ResourceAtlas.loader.register(["*"], async (): Promise<AnyResModule> => ({ r: {} }) as unknown as AnyResModule);

let seq = 0;
function makeMachine() {
  seq += 1;
  let toolset: Record<string, any>;
  const rm = RMachine.create({
    instanceName: `res-perlocale-batch-${seq}`,
    locales: ["en", "it"],
    defaultLocale: "en",
    ResourceAtlas,
  });
  ResourceAtlas.loader.register(["*"], async (path): Promise<AnyResModule> => {
    const { Shell } = toolset;
    if (path.startsWith("shell/greet")) {
      return {
        r: Shell.define(({ $ }: any) => ({ greeting: `real-${$.locale}`, extra: "keep" })),
      } as unknown as AnyResModule;
    }
    if (path.startsWith("shell/footer")) {
      return { r: Shell.define(({ $ }: any) => ({ note: `foot-${$.locale}` })) } as unknown as AnyResModule;
    }
    throw new Error(`res-perlocale-batch fixture: unknown resource "${path}"`);
  });
  toolset = rm.createToolset() as Record<string, any>;
  return toolset;
}

describe("res.perLocale.pickAll — all configured locales, locale-major", () => {
  it("resolves a single loader into Record<locale, Surface>", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({ greet: res.perLocale("shell/greet") }).define(async (plugin: any) => {
      const { greet } = plugin;
      return { all: await res.perLocale.pickAll(greet) };
    });
    const inst = (await g.create()) as { all: Record<string, any> };
    expect(inst.all).toEqual({
      en: { greeting: "real-en", extra: "keep" },
      it: { greeting: "real-it", extra: "keep" },
    });
  });

  it("resolves a loader MAP into Record<locale, bundle> (locale-major)", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({
      greet: res.perLocale("shell/greet"),
      footer: res.perLocale("shell/footer"),
    }).define(async (plugin: any) => {
      const { greet, footer } = plugin;
      return { all: await res.perLocale.pickAll({ greet, footer }) };
    });
    const inst = (await g.create()) as { all: Record<string, any> };
    expect(inst.all).toEqual({
      en: { greet: { greeting: "real-en", extra: "keep" }, footer: { note: "foot-en" } },
      it: { greet: { greeting: "real-it", extra: "keep" }, footer: { note: "foot-it" } },
    });
  });
});

describe("res.perLocale.pick — one locale, shape preserved", () => {
  it("resolves a loader MAP into a keyed bundle for the given locale", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({
      greet: res.perLocale("shell/greet"),
      footer: res.perLocale("shell/footer"),
    }).define(async (plugin: any) => {
      const { greet, footer } = plugin;
      return { it: await res.perLocale.pick("it", { greet, footer }) };
    });
    const inst = (await g.create()) as { it: Record<string, any> };
    expect(inst.it).toEqual({ greet: { greeting: "real-it", extra: "keep" }, footer: { note: "foot-it" } });
  });

  it("resolves a loader TUPLE into a tuple for the given locale", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({
      greet: res.perLocale("shell/greet"),
      footer: res.perLocale("shell/footer"),
    }).define(async (plugin: any) => {
      const { greet, footer } = plugin;
      return { en: await res.perLocale.pick("en", [greet, footer]) };
    });
    const inst = (await g.create()) as { en: any[] };
    expect(inst.en).toEqual([{ greeting: "real-en", extra: "keep" }, { note: "foot-en" }]);
  });

  it("propagates the loader's invalid-locale error", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({ greet: res.perLocale("shell/greet") }).define(async (plugin: any) => {
      const { greet } = plugin;
      return { pick: (locale: string) => res.perLocale.pick(locale, { greet }) };
    });
    const inst = (await g.create()) as { pick: (l: string) => Promise<unknown> };
    try {
      await inst.pick("de");
      expect.unreachable("pick with an unconfigured locale should reject");
    } catch (err) {
      expect((err as Error).message).toMatch(/de/);
    }
  });
});
