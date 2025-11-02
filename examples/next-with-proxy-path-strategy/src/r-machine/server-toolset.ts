import { NextToolset } from "@r-machine/next";
import { NextClientRMachine } from "./client-toolset";
import { rMachine, strategy } from "./r-machine";

export const { rMachineProxy, NextServerRMachine, generateLocaleStaticParams, getLocale, setLocale, pickR, pickRKit } =
  NextToolset.createForServer(rMachine, strategy, NextClientRMachine);
