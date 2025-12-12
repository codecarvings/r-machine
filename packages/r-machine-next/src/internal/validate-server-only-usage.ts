import { RMachineError } from "r-machine/errors";
import React from "react";

const isClient = "useState" in React;

export function validateServerOnlyUsage(name: string) {
  if (isClient) {
    throw new RMachineError(`${name} can't be used in Client Components.`);
  }
}
