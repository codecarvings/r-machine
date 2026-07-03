import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale } from "r-machine";
import "./pub/loader";
import { ResourceAtlas } from "./resource-atlas";

const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  shellKit: {
    fmt: "shell/lib/fmt",
  },
  experimental: {
    outerGear: "on",
  },
});

// HMR: noop in production, but in dev we listen for a custom "r-machine:update"
// event from `vite-plugin-r-machine-hmr.ts` and reload the changed resource.
if (import.meta.hot && !import.meta.env.TEST) {
  import.meta.hot.on("r-machine:update", ({ file }) => {
    rMachine.reloadModule(file);
  });
}

export const { BaseGear, OuterGear, Shell, DirectPlug, localized, res } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = ReactStandardStrategy.create(rMachine, {
  kit: {
    fmt: "shell/lib/fmt",
  },
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});

export const { localeHelper } = strategy.getHelpers();
