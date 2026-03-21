import { NextAppOriginStrategy } from "@r-machine/next/app";
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

export const strategy = new NextAppOriginStrategy(rMachine, {
  PathAtlas,
  // Origins per locale - See also next.config.ts
  localeOriginMap: {
    en: "http://english.test:3000",
    it: ["http://italiano.test:3000"],
  },
  // Exclude non-localized paths
  pathMatcher: /^(?!\/(__|hello-world|set-italian)($|\/)).*/,
});
