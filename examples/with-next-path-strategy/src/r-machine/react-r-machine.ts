"use client";

import { createReactRMachineContext } from "react-r-machine";
import { rMachineResolver } from "./r-machine";

export const { ReactRMachineProvider, useLocale, useR, useRKit } = createReactRMachineContext(rMachineResolver, {
  getLocale: ($) => $.localeOption || $.rMachine.config.defaultLocale,
  setLocale: () => {
    throw new Error("Not implemented");
  },
});
