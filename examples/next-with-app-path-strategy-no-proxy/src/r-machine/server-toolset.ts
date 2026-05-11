import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

export const { routeHandlers, NextServerRMachine, generateLocaleStaticParams, bindLocale, ServerPlug } =
  await strategy.createNoProxyServerToolset(NextClientRMachine);
