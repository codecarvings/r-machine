import "server-only";
import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";
import "./prv/loader";

export const { rMachineProxy, NextServerRMachine, generateLocaleStaticParams, bindLocale, setLocale, ServerPlug } =
  await strategy.createServerToolset(NextClientRMachine);
