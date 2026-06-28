import { afterEach, describe, expect, it, vi } from "vitest";
import { ASYNC, createPlug, createRequestScope, setPlugOverride } from "#r-machine/core";
import { RMachineConfigError } from "#r-machine/errors";
import type { AnyPlugHead } from "../../src/core/plug.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import { enableRMachineDevMode } from "../../src/lib/dev-mode.js";
import { defineLayout } from "../../src/lib/layout.js";
import { RMachine } from "../../src/lib/r-machine.js";

// A small but representative atlas exercised through the PUBLIC construction
// path (defineLayout → ResourceAtlas class → RMachine.create → createToolset),
// imported from SOURCE so r-machine.ts itself is instrumented.
const folders = defineLayout({
  "inner/": "gear:inner",
  "base/": "gear:base",
  "outer/": "gear:outer",
  "shell/": "shell",
});

type ResourceMap = {
  "inner/double": { double: (n: number) => number };
  "base/cfg": { url: string };
  "outer/counter": { value: number; inc: () => void };
  "shell/greeting": { text: string };
};

class ResourceAtlas extends folders<ResourceMap>() {}

// A loader for machines that never resolve anything (construction-only tests).
const emptyLoad = async (): Promise<AnyResModule> => ({ r: {} }) as unknown as AnyResModule;
// The loader now lives on the atlas. Register a default for the shared atlas;
// makeMachine overrides it per-call with a closure that resolves real gears.
ResourceAtlas.loader.register(["*"], emptyLoad);

// A loosely-typed machine handle: the locale param is widened to `string` so
// test call-sites can pass "en"/"it" freely, and deps/kit accept any namespace.
// Runtime behavior is unchanged — only the static view is relaxed for the tests.
type AnyMachine = RMachine<any, string, any, any>;

let seq = 0;
// Each machine gets a unique instanceName: RMachine.create caches on globalThis
// by name, so distinct names keep tests isolated within the worker.
function makeMachine(suffix = "", directKit: Record<string, string> = {}) {
  seq += 1;
  const instanceName = `block-c-${seq}-${suffix}`;
  let toolset: Record<string, any>;
  const rm = RMachine.create({
    instanceName,
    locales: ["en", "it"],
    defaultLocale: "en",
    ResourceAtlas,
    // Test helper: the kit values are real atlas namespaces, but the param is
    // loosely typed for call-site convenience — cast to satisfy the kit map.
    directKit: directKit as never,
    experimental: { outerGear: "on" },
  });
  // Loader lives on the (shared) atlas; this call overrides the module-level
  // default with a closure that resolves real gears for THIS machine's toolset.
  ResourceAtlas.loader.register(["*"], async (path): Promise<AnyResModule> => {
    const { InnerGear, BaseGear, OuterGear, Shell } = toolset;
    // Shells load from a locale-suffixed module path (e.g. "shell/greeting/it"),
    // so match by prefix rather than exact path.
    if (path.startsWith("shell/greeting")) {
      return {
        r: Shell.define(({ $ }: any) => ({ text: `hello (${$.locale})` })),
      } as unknown as AnyResModule;
    }
    switch (path) {
      case "inner/double":
        return { r: InnerGear.define(() => ({ double: (n: number) => n * 2 })) } as unknown as AnyResModule;
      case "base/cfg":
        return { r: BaseGear.define(() => ({ url: "https://api" })) } as unknown as AnyResModule;
      case "outer/counter":
        return {
          r: OuterGear.withState({ n: 0 }).define((plugin: any, _: any) => ({
            value: _.getter(() => plugin.$.state.n),
            inc: _.action(() => ({ n: plugin.$.state.n + 1 })),
          })),
        } as unknown as AnyResModule;
      default:
        throw new Error(`block-c fixture: unknown resource "${path}"`);
    }
  });
  toolset = rm.createToolset() as Record<string, any>;
  return { rm: rm as unknown as AnyMachine, toolset, instanceName };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("RMachine.create — construction & toolset", () => {
  it("builds a toolset whose composers resolve through the full stack", async () => {
    const { rm } = makeMachine("toolset");

    const plugin = (await rm.getGatePlugin({}, ["inner/double"], "en", ($) => $)) as [
      { double: (n: number) => number },
      unknown,
    ];

    expect(plugin[0].double(21)).toBe(42);
  });

  it("throws RMachineConfigError when the config is invalid (duplicate locales)", () => {
    expect(() =>
      RMachine.create({
        instanceName: "block-c-bad-config",
        locales: ["en", "en"],
        defaultLocale: "en",
        ResourceAtlas,
        experimental: { outerGear: "on" },
      })
    ).toThrow(RMachineConfigError);
  });

  it("resolveLayoutEntryType classifies a namespace by its layout prefix", () => {
    const { rm } = makeMachine("layout-type");

    expect(rm.resolveLayoutEntryType("inner/double" as AnyNamespace)).toBe("gear:inner");
    expect(rm.resolveLayoutEntryType("outer/counter" as AnyNamespace)).toBe("gear:outer");
    expect(rm.resolveLayoutEntryType("shell/greeting" as AnyNamespace)).toBe("shell");
  });

  it("OuterGear is omitted from the toolset when the experimental flag is off", () => {
    // A layout WITHOUT outer entries so the config validates with outerGear off.
    const innerOnly = defineLayout({ "inner/": "gear:inner" });
    class InnerAtlas extends innerOnly<{ "inner/x": { v: number } }>() {}
    InnerAtlas.loader.register(["*"], emptyLoad);
    const rm = RMachine.create({
      instanceName: "block-c-no-outer",
      locales: ["en"],
      defaultLocale: "en",
      ResourceAtlas: InnerAtlas,
    });

    const toolset = rm.createToolset() as Record<string, unknown>;
    expect(toolset.OuterGear).toBeUndefined();
    expect(toolset.InnerGear).toBeDefined();
  });
});

describe("RMachine — wire & gate resolution", () => {
  it("getWire returns a live wire for the requested deps", () => {
    const { rm } = makeMachine("wire");
    const wire = rm.getWire({}, ["inner/double"], "en", ($) => $);
    expect(wire).toBeDefined();
  });

  it("getGatePlugin applies a Plug override transform when present", async () => {
    const { rm } = makeMachine("gate-transform");

    const plug = createPlug({
      realm: "res",
      mode: "list",
      deps: [],
      nsDeps: [],
      nsDepList: [],
    } as unknown as AnyPlugHead);
    setPlugOverride(plug, { transform: () => ["TRANSFORMED"] });

    const out = await rm.getGatePlugin({}, ["inner/double"], "en", ($) => $, plug);
    expect(out).toEqual(["TRANSFORMED"]);
  });

  it("getGatePlugin returns the raw plugin when no override transform is present", async () => {
    const { rm } = makeMachine("gate-plain");
    const out = (await rm.getGatePlugin({}, ["base/cfg"], "en", ($) => $)) as [{ url: string }, unknown];
    expect(out[0].url).toBe("https://api");
  });
});

describe("RMachine — DirectPlug (container-free consumer plug)", () => {
  it("resolves a shell for an explicitly passed locale, async, with no container", async () => {
    const { toolset } = makeMachine("direct-basic");
    const plug = toolset.DirectPlug("shell/greeting");
    // No React context, no Next request scope present in this plain async call.
    const [s, $] = (await plug.useR("it")) as [{ text: string }, { locale: string }];
    expect(s.text).toBe("hello (it)");
    expect($.locale).toBe("it");
  });

  it("is a pure function of locale (different output per locale)", async () => {
    const { toolset } = makeMachine("direct-locales");
    const plug = toolset.DirectPlug("shell/greeting");
    const [en] = (await plug.useR("en")) as [{ text: string }, unknown];
    const [it] = (await plug.useR("it")) as [{ text: string }, unknown];
    expect(en.text).toBe("hello (en)");
    expect(it.text).toBe("hello (it)");
  });

  it("supports map-mode deps (object form)", async () => {
    const { toolset } = makeMachine("direct-map");
    const plug = toolset.DirectPlug({ greeting: "shell/greeting" });
    // Map mode spreads deps at the top level alongside `$`.
    const r = (await plug.useR("it")) as { greeting: { text: string }; $: { locale: string } };
    expect(r.greeting.text).toBe("hello (it)");
    expect(r.$.locale).toBe("it");
  });

  it("exposes directKit resources via $.kit", async () => {
    const { toolset } = makeMachine("direct-kit", { cfg: "base/cfg" });
    const plug = toolset.DirectPlug("shell/greeting");
    const [, $] = (await plug.useR("en")) as [unknown, { kit: { cfg: { url: string } } }];
    expect($.kit.cfg.url).toBe("https://api");
  });

  it("throws for a locale not in the configured list", async () => {
    const { toolset } = makeMachine("direct-bad-locale");
    const plug = toolset.DirectPlug("shell/greeting");
    await expect(plug.useR("fr")).rejects.toThrow(/invalid locale/i);
  });

  it("ignores a stored ambientLocale override — the explicit useR(locale) wins", async () => {
    const { toolset } = makeMachine("direct-override");
    const plug = toolset.DirectPlug("shell/greeting");
    // DirectPlug's locale is always explicit, so it exposes no locale key on its
    // mock at all (see MockCtxContent). Even a directly-stored override locale is a
    // no-op here — mock a dependency instead. The override's `transform` still
    // applies (covered by the getGatePlugin transform test above).
    setPlugOverride(plug, { ambientLocale: "it" });
    const [s] = (await plug.useR("en")) as [{ text: string }, unknown];
    expect(s.text).toBe("hello (en)"); // explicit "en" wins; the stored override is ignored
  });
});

describe("RMachine — connector sync sibling (getWireSync)", () => {
  it("returns a plugin when deps are warm and ASYNC when cold", async () => {
    const { rm } = makeMachine("sync");
    const connector = (
      rm as unknown as { createResComposerConnector(kit: Record<string, never>): { getWireSync: Function } }
    ).createResComposerConnector({});

    // Cold: nothing warmed yet → decline with ASYNC.
    expect(connector.getWireSync(["inner/double"], "en", ($: unknown) => $, [])).toBe(ASYNC);

    // Warm the dependency slot via the async path.
    await rm.getGatePlugin({}, ["inner/double"], "en", ($) => $);

    // Warm: the sync sibling assembles the plugin without awaiting.
    const wired = connector.getWireSync(["inner/double"], "en", ($: unknown) => $, []) as { plugin: unknown[] };
    expect(wired).not.toBe(ASYNC);
    expect(wired.plugin).toBeDefined();
  });
});

describe("RMachine — requestScope delegation", () => {
  it("install / get / dispose forward to the ResManager", () => {
    const { rm } = makeMachine("scope");
    const scope = createRequestScope();
    const provider = { getActiveScope: () => scope };

    rm.requestScope.installProvider(provider);
    expect(rm.requestScope.getProvider()).toBe(provider);
    expect(() => rm.requestScope.dispose(scope)).not.toThrow();
  });
});

describe("RMachine — reloadModule", () => {
  it("triggers the HMR cascade for a previously loaded path (no throw)", async () => {
    const { rm } = makeMachine("reload");
    await rm.getGatePlugin({}, ["inner/double"], "en", ($) => $);

    expect(() => rm.reloadModule("inner/double")).not.toThrow();
  });
});

describe("RMachine.create — singleton caching", () => {
  it("returns the cached instance for the same instanceName", () => {
    // Inlined (not extracted) so the literal config keeps its contextual type.
    const a = RMachine.create({
      instanceName: "block-c-singleton",
      locales: ["en"],
      defaultLocale: "en",
      ResourceAtlas,
      experimental: { outerGear: "on" },
    });
    const b = RMachine.create({
      instanceName: "block-c-singleton",
      locales: ["en"],
      defaultLocale: "en",
      ResourceAtlas,
      experimental: { outerGear: "on" },
    });
    expect(b).toBe(a);
  });

  it("in dev, reusing the cached instance disposes its prior resources", () => {
    // isDevEnv(true) is false under NODE_ENV=test; force dev so the reuse
    // branch runs its disposeResources() cleanup.
    vi.stubEnv("NODE_ENV", "development");

    const first = RMachine.create({
      instanceName: "block-c-singleton-dev",
      locales: ["en"],
      defaultLocale: "en",
      ResourceAtlas,
      experimental: { outerGear: "on" },
    });
    const disposeSpy = vi.spyOn(
      (first as unknown as { resManager: { disposeResources(): void } }).resManager,
      "disposeResources"
    );

    const second = RMachine.create({
      instanceName: "block-c-singleton-dev",
      locales: ["en"],
      defaultLocale: "en",
      ResourceAtlas,
      experimental: { outerGear: "on" },
    });
    expect(second).toBe(first);
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});

describe("toolset.localized", () => {
  it("returns the shell verbatim (identity passthrough)", () => {
    const { toolset } = makeMachine("localized");
    const shell = { text: "hi" };
    const out = (toolset as unknown as { localized: (ns: string, s: unknown) => unknown }).localized(
      "shell/greeting",
      shell
    );
    expect(out).toBe(shell);
  });
});

describe("enableRMachineDevMode", () => {
  it("subscribes a console logger to the bus and returns an unsubscribe", async () => {
    const { rm } = makeMachine("dev-mode");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const off = enableRMachineDevMode(rm);
      // Resolution emits bus events → the logger fires.
      await rm.getGatePlugin({}, ["inner/double"], "en", ($) => $);
      expect(logSpy).toHaveBeenCalled();
      expect(logSpy.mock.calls.some(([msg]) => String(msg).startsWith("[R-Machine]"))).toBe(true);

      const callsBefore = logSpy.mock.calls.length;
      off();
      await rm.getGatePlugin({}, ["base/cfg"], "en", ($) => $);
      // After unsubscribe no further logs flow.
      expect(logSpy.mock.calls.length).toBe(callsBefore);
    } finally {
      logSpy.mockRestore();
    }
  });
});
