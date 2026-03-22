import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

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
