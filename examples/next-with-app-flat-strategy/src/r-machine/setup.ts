import { NextAppFlatStrategy } from "@r-machine/next/app";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { Formatters } from "./formatters";
import { PathAtlas } from "./path-atlas";
import type { ResourceAtlas } from "./resource-atlas";

// Step 1: create a r-machine builder with config (locales, defaultLocale, rModuleResolver);
//         export the inferred Locale type for use in the rest of the app
const rMachineBuilder = RMachine.builder({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});
export type Locale = RMachineLocale<typeof rMachineBuilder>;

// Step 2: extend the builder with custom formatters;
//         export the inferred R$ type (context for the factories in the resource modules)
const rMachineExtBuilder = rMachineBuilder.with({ Formatters });
export type R$ = RMachineRCtx<typeof rMachineExtBuilder>;

// Step 3: create the r-machine instance mapped to the ResourceAtlas type (the shape of the resources returned by the modules)
export const rMachine = rMachineExtBuilder.create<ResourceAtlas>();

// Step 4: setup the strategy
export const strategy = new NextAppFlatStrategy(rMachine, {
  PathAtlas,
  // Exclude non-localized paths
  pathMatcher: /^(?!\/(__|hello-world|set-italian)($|\/)).*/,
});
