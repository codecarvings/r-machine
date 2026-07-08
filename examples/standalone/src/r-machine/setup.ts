import { RMachine, type RMachineLocale } from "r-machine";
import "./pub/loader.ts";
import { ResourceAtlas } from "./resource-atlas.ts";

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
  // Ambient shared resources surfaced as `$.kit` on direct plugs.
  directKit: {
    fmt: "shell/lib/fmt",
  },
});

export const { BaseGear, Shell, DirectPlug, localized, res } = rMachine.createToolset();

// The locale helper is available standalone too (content negotiation, locale
// enumeration) — here we use it to iterate the configured locales in main.ts.
export const { localeHelper } = rMachine;

export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";
