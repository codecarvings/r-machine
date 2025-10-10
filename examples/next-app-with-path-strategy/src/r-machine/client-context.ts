"use client";

import { createReactRMachineContext } from "react-r-machine";
import { rMachine } from "./r-machine";

export const { ReactRMachineProvider, useLocale, useRMachine, useR, useRKit } = createReactRMachineContext(rMachine, {
  getLocale: ($) => $.localeOption,
  setLocale: () => {
    throw new Error("Not implemented");
  },
});
