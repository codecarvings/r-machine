import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./r-machine";

export const {
  routeHandlers,
  NextServerRMachine,
  generateLocaleStaticParams,
  bindLocale,
  getLocale,
  setLocale,
  pickR,
  pickRKit,
  getPathComposer,
} = await strategy.createNoProxyServerToolset(NextClientRMachine);
