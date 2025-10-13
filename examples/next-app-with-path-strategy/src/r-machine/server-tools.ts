import { createNextAppRouterServerTools } from "@/lib-temp/next-app-router-server-tools";
import { NextClientRMachine } from "./client-tools";
import { rMachine, strategy } from "./r-machine";

export const { NextServerRMachine, applyLocale, getLocale, setLocale, pickR, pickRKit } =
  createNextAppRouterServerTools(rMachine, strategy, NextClientRMachine);
