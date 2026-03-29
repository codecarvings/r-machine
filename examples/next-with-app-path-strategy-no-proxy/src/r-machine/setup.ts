import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { PathAtlas } from "./path-atlas";
import { ResourceAtlas } from "./resource-atlas";

export const rMachine = RMachine.create({
  ResourceAtlas,
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
}) as any; // TODO: WIP

export type Locale = RMachineLocale<typeof rMachine>;
export type R$ = RMachineRCtx<typeof rMachine>;

// Step 4: setup the strategy
export const strategy = new NextAppPathStrategy(rMachine, {
  PathAtlas,
  autoDetectLocale: "off",
  cookie: "on",
});
