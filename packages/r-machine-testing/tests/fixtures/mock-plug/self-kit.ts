import { defineLayout, RMachine } from "r-machine";
import type { AnyResModule } from "r-machine/core";

// Regression fixture for the deferred SELF-reference kit getter (see
// `mock-plug-self-kit.test.ts`). A machine-wide `shellKit` whose single entry
// points at the very shell it is injected into makes `shell/self-kit` resolve
// with a deferred cycle-breaker getter on `$.kit.self` — that getter throws
// while its own slot is still mid-resolution. At runtime nobody reads it, but
// `mockPlug`'s eager state-binding scan used to trip it.
const folders = defineLayout({ "shell/": "shell" });

type ResourceMap = {
  // Resolved BY namespace as its own `$.kit.self`, so it needs an atlas entry.
  "shell/self-kit": { tag: string };
};

class ResourceAtlas extends folders<ResourceMap>() {}

// The closure only runs when a test instantiates the resource (via
// `ctrl.createRes()` / `instantiateRes`), by which point the `r` binding below
// is initialised (same deferred-reference pattern as `setup.ts`).
// Shells are locale-aware, so the loader path carries a `/<locale>` suffix
// (`shell/self-kit/en`) — the module is the same across locales (content is
// decided inside `define` via `$.locale`), so match on the base namespace.
ResourceAtlas.loader.register(["*"], async (path): Promise<AnyResModule> => {
  if (path.startsWith("shell/self-kit")) {
    return { r } as unknown as AnyResModule;
  }
  throw new Error(`self-kit fixture: unknown resource "${path}"`);
});

const rMachine = RMachine.create({
  instanceName: "mock-plug-self-kit",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  // Machine-wide shell kit whose entry IS this shell → self-reference.
  shellKit: { self: "shell/self-kit" },
});

const { Shell } = rMachine.createToolset();

// Mirrors `examples/next .../shell/lib/fmt`: locale-aware content that never
// touches `$.kit.self`, so the deferred self-ref getter is invisible at runtime.
export const r = Shell.define((plugin) => ({ tag: `self@${plugin.$.locale}` }));
