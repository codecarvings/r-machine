import { createReactRMachineContext } from "react-r-machine";
import type { Atlas } from "./atlas";

export const { RMachineProvider, useLocale, useR, useRKit } = createReactRMachineContext<Atlas>();
