import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

export const { routeHandlers, NextServerRMachine, generateLocaleStaticParams, bindLocale, setLocale, ServerPlug } =
  await strategy.createNoProxyServerToolset(NextClientRMachine);
