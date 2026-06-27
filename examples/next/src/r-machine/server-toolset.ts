import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";
import "./prv/loader"; // registers the server-only loaders

export const { rMachineProxy, NextServerRMachine, generateLocaleStaticParams, bindLocale, setLocale, ServerPlug } =
  await strategy.createServerToolset(NextClientRMachine);
