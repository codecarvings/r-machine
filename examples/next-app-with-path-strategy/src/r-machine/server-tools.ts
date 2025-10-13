import { createNextAppRouterServerTools } from "@/lib-temp/next-app-router-server-tools";
import { NextClientRMachine } from "./client-tools";

export const { NextServerRMachine, applyLocale, getLocale, setLocale, pickR, pickRKit } =
  createNextAppRouterServerTools(NextClientRMachine);


