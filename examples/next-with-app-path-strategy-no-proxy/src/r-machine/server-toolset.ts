import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

export const { routeHandlers, NextServerRMachine, generateLocaleStaticParams, ServerPlug } =
  await strategy.createNoProxyServerToolset(NextClientRMachine);
