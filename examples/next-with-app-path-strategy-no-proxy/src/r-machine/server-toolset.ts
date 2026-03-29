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
  getPathComposer,
} = await strategy.createNoProxyServerToolset(NextClientRMachine);
