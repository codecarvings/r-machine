import { createReactRMachineHooks } from "react-r-machine";
import type { Atlas } from "./atlas";

export const { useR, useRKit } = createReactRMachineHooks<Atlas>();
