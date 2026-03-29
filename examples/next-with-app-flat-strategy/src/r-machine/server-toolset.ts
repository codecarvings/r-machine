import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

export const {
  rMachineProxy,
  NextServerRMachine,
  generateLocaleStaticParams,
  bindLocale,
  getLocale,
  setLocale,
  pickR,
  pickRKit,
  getPathComposer,
} = await strategy.createServerToolset(NextClientRMachine);
