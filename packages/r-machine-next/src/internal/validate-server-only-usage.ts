import { RMachineUsageError } from "r-machine/errors";
import React from "react";
import { ERR_SERVER_ONLY } from "#r-machine/next/errors";

const isClient = "useState" in React;

export function validateServerOnlyUsage(name: string) {
  if (isClient) {
    throw new RMachineUsageError(ERR_SERVER_ONLY, `${name} can't be used in Client Components.`);
  }
}
