import { createNextRMachineProvider } from "next-r-machine";
import { rMachineResolver } from "./r-machine";
import { ReactRMachineProvider } from "./react-r-machine";

export const NextRMachineProvider = createNextRMachineProvider(rMachineResolver, ReactRMachineProvider);
