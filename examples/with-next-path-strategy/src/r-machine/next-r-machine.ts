import { createNextRMachineContext } from "next-r-machine";
import { rMachineResolver } from "./r-machine";
import { ReactRMachineProvider } from "./react-r-machine";

export const { NextRMachineProvider, getLocale, setLocale, pickR, pickRKit } = createNextRMachineContext(
  rMachineResolver,
  ReactRMachineProvider
);
