import { ReactToolset } from "@r-machine/react";
import { rMachine, strategy } from "./r-machine";

export const { ReactRMachine, useLocale, useSetLocale, useR, useRKit } = ReactToolset.create(rMachine, strategy);
