import { defineLayout, RMachine } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { describe, expect, it } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";

// Mock seam for a `res.perLocale(...)` dep: the dep resolves to a locale loader
// `(locale) => Promise<Surface>`, so it is mocked with a FUNCTION returning a
// PARTIAL that is deep-merged ON TOP of the REAL localized surface — per call,
// per alias (un-mocked pickers keep resolving for real).
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
    instanceName: `mock-shell-picker-${seq}`,
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
    throw new Error(`mock-shell-picker fixture: unknown resource "${path}"`);
  });
  toolset = rm.createToolset() as Record<string, any>;
  return toolset;
}

describe("mockPlug — res.perLocale dep (map form)", () => {
  it("resolves the real localized shell when the dep is not mocked", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({ greet: res.perLocale("shell/greet") }).define(({ greet }: any) => ({
      greetIn: (locale: string) => greet(locale),
    }));
    const inst = (await g.create()) as { greetIn: (l: string) => Promise<any> };
    expect(await inst.greetIn("en")).toEqual({ greeting: "real-en", extra: "keep" });
    expect(await inst.greetIn("it")).toEqual({ greeting: "real-it", extra: "keep" });
  });

  it("deep-merges the mock's partial ON TOP of the real localized surface", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({ greet: res.perLocale("shell/greet") }).define(({ greet }: any) => ({
      greetIn: (locale: string) => greet(locale),
    }));
    using _ctrl = mockPlug(g).with({ greet: async () => ({ greeting: "MOCK" }) } as never);

    const inst = (await g.create()) as { greetIn: (l: string) => Promise<any> };
    // `greeting` comes from the mock; `extra` is inherited from the REAL surface.
    expect(await inst.greetIn("en")).toEqual({ greeting: "MOCK", extra: "keep" });
  });

  it("passes the call-time locale to the mock (mock may vary by locale)", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({ greet: res.perLocale("shell/greet") }).define(({ greet }: any) => ({
      greetIn: (locale: string) => greet(locale),
    }));
    using _ctrl = mockPlug(g).with({ greet: async (locale: string) => ({ greeting: `mock-${locale}` }) } as never);

    const inst = (await g.create()) as { greetIn: (l: string) => Promise<any> };
    expect(await inst.greetIn("it")).toEqual({ greeting: "mock-it", extra: "keep" });
  });

  it("mocking is per-alias: an un-mocked picker still resolves for real", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({
      greet: res.perLocale("shell/greet"),
      footer: res.perLocale("shell/footer"),
    }).define(({ greet, footer }: any) => ({
      greetIn: (locale: string) => greet(locale),
      footIn: (locale: string) => footer(locale),
    }));
    using _ctrl = mockPlug(g).with({ greet: async () => ({ greeting: "MOCK" }) } as never);

    const inst = (await g.create()) as {
      greetIn: (l: string) => Promise<any>;
      footIn: (l: string) => Promise<any>;
    };
    expect(await inst.greetIn("en")).toEqual({ greeting: "MOCK", extra: "keep" });
    expect(await inst.footIn("en")).toEqual({ note: "foot-en" }); // real
  });
});

describe("mockPlug — res.perLocale dep (list form)", () => {
  it("mocks a picker at its positional index, deep-merged over the real surface", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps(res.perLocale("shell/greet")).define(([greet]: any) => ({
      greetIn: (locale: string) => greet(locale),
    }));
    using _ctrl = mockPlug(g).with({ 0: async () => ({ greeting: "MOCK" }) } as never);

    const inst = (await g.create()) as { greetIn: (l: string) => Promise<any> };
    expect(await inst.greetIn("it")).toEqual({ greeting: "MOCK", extra: "keep" });
  });
});
