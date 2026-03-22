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
  getFmt,
  getPathComposer,
} = await strategy.createNoProxyServerToolset(NextClientRMachine);
