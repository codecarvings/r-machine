import { describe, expect, it } from "vitest";
import type { AnyResModule } from "../../src/core/res-module.js";
import { defineLayout } from "../../src/lib/layout.js";
import { RMachine } from "../../src/lib/r-machine.js";

// End-to-end for `res.perLocale(...)`: a locale-agnostic gear declares a
// shell as a dep; the resolved value is a loader `(locale) => Promise<Surface>`
// the gear calls at runtime with a locale it receives as data.
const folders = defineLayout({
  "base/": "gear:base",
  "shell/": "shell",
});

type ResourceMap = {
  "base/cfg": { url: string };
  "shell/greeting": { text: string };
  // A shell that reuses ANOTHER locale's shell via `res.perLocale`.
  "shell/multi": { ownLocale: string; greetIn: (locale: string) => Promise<{ text: string }> };
};

class ResourceAtlas extends folders<ResourceMap>() {}
ResourceAtlas.loader.register(["*"], async (): Promise<AnyResModule> => ({ r: {} }) as unknown as AnyResModule);

let seq = 0;
function makeMachine() {
  seq += 1;
  let toolset: Record<string, any>;
  const rm = RMachine.create({
    instanceName: `with-shell-picker-${seq}`,
    locales: ["en", "it"],
    defaultLocale: "en",
    ResourceAtlas,
  });
  ResourceAtlas.loader.register(["*"], async (path): Promise<AnyResModule> => {
    const { BaseGear, Shell, res } = toolset;
    // Shell path is locale-suffixed (e.g. "shell/greeting/it") → match by prefix.
    if (path.startsWith("shell/greeting")) {
      return { r: Shell.define(({ $ }: any) => ({ text: `hello (${$.locale})` })) } as unknown as AnyResModule;
    }
    // A SHELL declaring a shell-picker dep: it has its own ambient locale but can
    // pull `shell/greeting` in ANY locale on demand (cross-locale reuse).
    if (path.startsWith("shell/multi")) {
      return {
        r: Shell.withDeps({ greetLoader: res.perLocale("shell/greeting") }).define(({ greetLoader, $ }: any) => ({
          ownLocale: $.locale,
          greetIn: (locale: string) => greetLoader(locale),
        })),
      } as unknown as AnyResModule;
    }
    if (path.startsWith("base/cfg")) {
      return { r: BaseGear.define(() => ({ url: "https://api" })) } as unknown as AnyResModule;
    }
    throw new Error(`with-shell-picker fixture: unknown resource "${path}"`);
  });
  toolset = rm.createToolset() as Record<string, any>;
  return toolset;
}

describe("res.perLocale — map form", () => {
  it("resolves the shell surface for the locale passed at call time", async () => {
    const { BaseGear, res } = makeMachine();
    const greeter = BaseGear.withDeps({ greeting: res.perLocale("shell/greeting") }).define(({ greeting }: any) => ({
      greet: (locale: string) => greeting(locale),
    }));
    const inst = (await greeter.create()) as { greet: (l: string) => Promise<any> };
    expect((await inst.greet("en")).text).toBe("hello (en)");
    expect((await inst.greet("it")).text).toBe("hello (it)");
  });

  it("coexists with a normal dep (which stays a resolved surface)", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps({ cfg: "base/cfg", greeting: res.perLocale("shell/greeting") }).define(
      ({ cfg, greeting }: any) => ({
        url: cfg.url,
        greet: (locale: string) => greeting(locale),
      })
    );
    const inst = (await g.create()) as { url: string; greet: (l: string) => Promise<any> };
    expect(inst.url).toBe("https://api");
    expect((await inst.greet("it")).text).toBe("hello (it)");
  });
});

describe("res.perLocale — list (positional) form", () => {
  it("re-inserts the loader at its original tuple position, interleaved with normal deps", async () => {
    const { BaseGear, res } = makeMachine();
    const g = BaseGear.withDeps("base/cfg", res.perLocale("shell/greeting")).define(([cfg, greeting]: any) => ({
      url: cfg.url,
      greet: (locale: string) => greeting(locale),
    }));
    const inst = (await g.create()) as { url: string; greet: (l: string) => Promise<any> };
    // cfg (index 0) is a plain surface; greeting (index 1) is the loader.
    expect(inst.url).toBe("https://api");
    expect((await inst.greet("en")).text).toBe("hello (en)");
  });
});

describe("res.perLocale — invalid locale", () => {
  it("throws when the loader is called with an unknown locale", async () => {
    const { BaseGear, res } = makeMachine();
    const greeter = BaseGear.withDeps({ greeting: res.perLocale("shell/greeting") }).define(({ greeting }: any) => ({
      greet: (locale: string) => greeting(locale),
    }));
    const inst = (await greeter.create()) as { greet: (l: string) => Promise<any> };
    try {
      await inst.greet("xx");
      expect.unreachable("expected an invalid-locale error");
    } catch (e) {
      expect((e as Error).message).toMatch(/invalid locale/i);
    }
  });
});

describe("res.perLocale — inside a SHELL (cross-locale reuse)", () => {
  it("a shell resolves ANOTHER locale's shell on demand, independent of its own", async () => {
    const { DirectPlug } = makeMachine();
    // Resolve shell/multi in "en"; its factory captured a picker on shell/greeting.
    const [multi, $] = (await DirectPlug("shell/multi").useR("en")) as [
      { ownLocale: string; greetIn: (l: string) => Promise<{ text: string }> },
      { locale: string },
    ];
    expect(multi.ownLocale).toBe("en"); // the shell's OWN ambient locale
    expect($.locale).toBe("en");
    // …yet it can pull shell/greeting in any other locale on demand.
    expect((await multi.greetIn("it")).text).toBe("hello (it)");
    expect((await multi.greetIn("en")).text).toBe("hello (en)");
  });
});
