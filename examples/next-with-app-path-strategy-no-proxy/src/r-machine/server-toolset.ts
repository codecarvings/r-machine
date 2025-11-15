import { NextToolset } from "@r-machine/next";
import { NextClientRMachine } from "./client-toolset";
import { rMachine, strategy } from "./r-machine";

export const { NextServerRMachine, generateLocaleStaticParams, bindLocale, getLocale, setLocale, pickR, pickRKit } =
  await NextToolset.createForServer(rMachine, strategy, NextClientRMachine);
