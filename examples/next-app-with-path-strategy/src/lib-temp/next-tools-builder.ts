import { RMachineError } from "r-machine";
import { createNextAppRouterClientTools } from "./next-app-router/next-app-router-client-tools";
import { createNextAppRouterServerTools } from "./next-app-router/next-app-router-server-tools";
import { NextAppRouterStrategy } from "./next-app-router/next-app-router-strategy";

type CreateClient = typeof createNextAppRouterClientTools;

type CreateServer = typeof createNextAppRouterServerTools;

interface NextToolsBuilder {
  readonly createClient: CreateClient;
  readonly createServer: CreateServer;
}

export const NextTools: NextToolsBuilder = {
  createClient: (rMachine, strategy) => {
    if (strategy instanceof NextAppRouterStrategy) {
      return createNextAppRouterClientTools(rMachine, strategy);
    }

    throw new RMachineError("Unable to create RMachine Next Client Tools - Unsupported strategy");
  },

  createServer: (rMachine, strategy, NextClientRMachine) => {
    if (strategy instanceof NextAppRouterStrategy) {
      return createNextAppRouterServerTools(rMachine, strategy, NextClientRMachine);
    }

    throw new RMachineError("Unable to create RMachine Next Server Tools - Unsupported strategy");
  },
};
