import { createNextRMachineContext } from "next-r-machine";
import { ReactRMachineProvider } from "./client-context";
import { rMachine } from "./r-machine";

export const { NextRMachineProvider, getLocale, setLocale, getRMachine, pickR, pickRKit } = createNextRMachineContext(
  rMachine,
  {
    getLocale: ($) => $.localeOption,
    setLocale: () => {
      throw new Error("Not implemented");
    },
  },
  ReactRMachineProvider
);
