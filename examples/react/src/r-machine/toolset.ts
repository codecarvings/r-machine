import { ReactToolset } from "@r-machine/react";
import { rMachine } from "./r-machine";

export const { ReactRMachine, useLocale, useR, useRKit } = ReactToolset.create(rMachine);
