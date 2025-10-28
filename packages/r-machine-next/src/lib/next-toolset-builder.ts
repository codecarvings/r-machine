import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import {
  createNextClientToolset,
  type NextClientRMachine,
  type NextClientToolset,
  NextStrategy,
} from "#r-machine/next/core";
import {
  createNextAppRouterServerToolset,
  type NextAppRouterServerToolset,
  NextAppRouterStrategy,
} from "#r-machine/next/core/app-router";

interface NextToolsetBuilder {
  createClient<A extends AnyAtlas>(rMachine: RMachine<A>, strategy: NextStrategy<any>): NextClientToolset<A>;

  createServer<A extends AnyAtlas, LK extends string>(
    rMachine: RMachine<A>,
    strategy: NextAppRouterStrategy<any, LK>,
    NextClientRMachine: NextClientRMachine
  ): NextAppRouterServerToolset<A, LK>;
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
