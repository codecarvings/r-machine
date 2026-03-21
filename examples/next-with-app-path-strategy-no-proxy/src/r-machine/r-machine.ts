import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { fmt } from "./formatters";
import { PathAtlas } from "./path-atlas";
import type { ResourceAtlas } from "./resource-atlas";

// Step 1: config → Locale
const rMachineBuilder = RMachine.builder({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export type Locale = RMachineLocale<typeof rMachineBuilder>;

// Step 2: formatters → RCtx
const rMachineSetup = rMachineBuilder.with({ formatters: fmt });
export type R$ = RMachineRCtx<typeof rMachineSetup>;

// Step 3: ResourceAtlas → RMachine
export const rMachine = rMachineSetup.create<ResourceAtlas>();

export const strategy = new NextAppPathStrategy(rMachine, {
  PathAtlas,
  autoDetectLocale: "off",
  cookie: "on",
});
