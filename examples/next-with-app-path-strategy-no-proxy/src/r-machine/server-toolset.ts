import { NextToolset } from "@r-machine/next";
import { NextClientRMachine } from "./client-toolset";
import { rMachine, strategy } from "./r-machine";

export const {
  NextServerRMachine,
  rMachineProxy,
  generateLocaleStaticParams,
  bindLocale,
  getLocale,
  setLocale,
  getPathBuilder,
  pickR,
  pickRKit,
} = await NextToolset.createForServer(rMachine, strategy, NextClientRMachine);
