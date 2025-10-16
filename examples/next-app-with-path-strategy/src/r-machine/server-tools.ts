import { NextTools } from "@/lib-temp/next-tools-builder";
import { NextClientRMachine } from "./client-tools";
import { rMachine, strategy } from "./r-machine";

export const { NextServerRMachine, bindLocale, getLocale, setLocale, pickR, pickRKit } = NextTools.createServer(
  rMachine,
  strategy,
  NextClientRMachine
);
