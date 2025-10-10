"use client";

import { createReactRMachineContext } from "react-r-machine";
import { rMachine } from "./r-machine";

export const { ReactRMachineProvider, useLocale, useR, useRKit } = createReactRMachineContext(rMachine, {
  getLocale: ($) => $.localeOption || $.rMachine.config.defaultLocale,
  setLocale: () => {
    throw new Error("Not implemented");
  },
});
