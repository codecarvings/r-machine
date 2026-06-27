import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";
import "./prv/loader";

export const { routeHandlers, NextServerRMachine, generateLocaleStaticParams, bindLocale, setLocale, ServerPlug } =
  await strategy.createNoProxyServerToolset(NextClientRMachine);
