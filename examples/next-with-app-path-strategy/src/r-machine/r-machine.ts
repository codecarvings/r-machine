import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { fmt } from "./formatters";
import { PathAtlas } from "./path-atlas";
import type { ResourceAtlas } from "./resource-atlas";

// Step 1: config → Locale
const rMachineBuilder = RMachine.builder({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export type Locale = RMachineLocale<typeof rMachineBuilder>;

// Step 2: Formatters → RCtx
const rMachineSetup = rMachineBuilder.with({ Formatters: fmt });
export type R$ = RMachineRCtx<typeof rMachineSetup>;

// Step 3: ResourceAtlas → RMachine
export const rMachine = rMachineSetup.create<ResourceAtlas>();

export const strategy = new NextAppPathStrategy(rMachine, {
  PathAtlas,
  cookie: "on",
  // implicitDefaultLocale: "on",
  implicitDefaultLocale: {
    // Exclude non-localized paths from implicit default locale handling
    pathMatcher: /^(?!\/(__|hello-world|set-italian)($|\/)).*/,
  },

  // autoLocaleBinding: "on",
  // localeLabel: "strict",
  // basePath: "/subdir",
});
