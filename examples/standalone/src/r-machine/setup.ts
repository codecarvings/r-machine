import { RMachine, type RMachineLocale } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas.ts";

// Explicit module map — the bundler-free loader. Each entry is a LITERAL
// `import(...)`, so it resolves identically everywhere: plain `tsx` (the CLI),
// Vite (vitest), and `verifyResourceAtlas`. The map key is the resolved path the
// loader receives — already locale-suffixed for shells.
const modules: Record<string, () => Promise<AnyResModule>> = {
  "base/config": () => import("./base/config.ts"),
  "shell/greeting/en": () => import("./shell/greeting/en.ts"),
  "shell/greeting/it": () => import("./shell/greeting/it.ts"),
  "shell/lib/fmt": () => import("./shell/lib/fmt.ts"),
};

// R-Machine, STANDALONE: only the `r-machine` core package — no framework
// strategy (`@r-machine/react` / `@r-machine/next`), no bundler. Resources are
// consumed via `DirectPlug` (see ../main.ts), which connects directly to the
// machine: the locale is passed explicitly to `useR(locale)`.
// Exported so consumers (and `verifyResourceAtlas`, see tests) can reach the
// machine directly — there is no strategy to hold it.
export const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  // Bundler-free loader: look the resolved path up in the explicit module map.
  load: (path) => {
    const loader = modules[path];
    if (!loader) {
      throw new Error(`Resource module not registered: "${path}"`);
    }
    return loader();
  },
  // Ambient shared resources surfaced as `$.kit` on direct plugs.
  directKit: {
    fmt: "shell/lib/fmt",
  },
});

export const { BaseGear, Shell, DirectPlug, localized } = rMachine.createToolset();

// The locale helper is available standalone too (content negotiation, locale
// enumeration) — here we use it to iterate the configured locales in main.ts.
export const { localeHelper } = rMachine;

export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";
