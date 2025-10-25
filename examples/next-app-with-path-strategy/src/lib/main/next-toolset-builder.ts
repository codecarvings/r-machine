import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/common";
import {
  createNextAppRouterServerToolset,
  type NextAppRouterServerToolset,
} from "../core/app-router/next-app-router-server-toolset";
import { NextAppRouterStrategy } from "../core/app-router/next-app-router-strategy";
import { createNextClientToolset, type NextClientRMachine, type NextClientToolset } from "../core/next-client-toolset";
import { NextStrategy } from "../core/next-strategy";

interface NextToolsetBuilder {
  readonly createClient: <A extends AnyAtlas>(
    rMachine: RMachine<A>,
    strategy: NextStrategy<any>
  ) => NextClientToolset<A>;

  readonly createServer: <A extends AnyAtlas, LK extends string>(
    rMachine: RMachine<A>,
    strategy: NextAppRouterStrategy<any, LK>,
    NextClientRMachine: NextClientRMachine
  ) => NextAppRouterServerToolset<A, LK>;
}

export const NextToolset: NextToolsetBuilder = {
  createClient: (rMachine, strategy) => {
    const strategyConfig = NextStrategy.getConfig(strategy);
    const implPackage = NextStrategy.getClientImplPackage(strategy);
    return createNextClientToolset(rMachine, strategyConfig, implPackage);
  },

  createServer: (rMachine, strategy, NextClientRMachine) => {
    if (strategy instanceof NextAppRouterStrategy) {
      const localeKey = NextAppRouterStrategy.getLocaleKey(strategy);
      const strategyConfig = NextStrategy.getConfig(strategy);
      const implPackage = NextAppRouterStrategy.getServerImplPackage(strategy);
      return createNextAppRouterServerToolset(rMachine, localeKey, strategyConfig, implPackage, NextClientRMachine);
    }

    throw new RMachineError("Unable to create RMachine Next Server Tools - Unsupported strategy.");
  },
};
