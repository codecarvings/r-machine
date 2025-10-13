import { createNextRMachineContext } from "@/lib-temp/next-r-machine-context";
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
