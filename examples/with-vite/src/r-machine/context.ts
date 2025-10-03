import { createRMachineContext } from "react-r-machine";
import { rMachine } from "./r-machine";

export const { RMachineProvider, useR, useRKit } = createRMachineContext(rMachine);
