import { createNextRMachineContext } from "next-r-machine";
import { ReactRMachineProvider } from "./client-context";
import { rMachine } from "./r-machine";

export const { NextRMachineProvider, getLocale, setLocale, pickR, pickRKit } = createNextRMachineContext(
  rMachine,
  ReactRMachineProvider
);
