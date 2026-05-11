import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

export const { rMachineProxy, NextServerRMachine, generateLocaleStaticParams, bindLocale, ServerPlug } =
  await strategy.createServerToolset(NextClientRMachine);
