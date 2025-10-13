import { createNextRMachineContext } from "@/lib-temp/next-app-router-tools";
import { ReactRMachine } from "./client-tools";
import { rMachine } from "./r-machine";

export const { NextRMachineProvider, getLocale, setLocale, pickR, pickRKit } = createNextRMachineContext(
  rMachine,
  {
    readLocale: ($) => "en",
    writeLocale: () => {
      throw new Error("Not implemented");
    },
  },
  ReactRMachine
);
