import { NextToolset } from "@r-machine/next";
import { NextClientRMachine } from "./client-toolset";
import { rMachine, strategy } from "./r-machine";

export const {
  NextServerRMachine,
  EntrancePage,
  generateLocaleStaticParams,
  bindLocale,
  getLocale,
  setLocale,
  pickR,
  pickRKit,
} = NextToolset.createServer(rMachine, strategy, NextClientRMachine);
