import type { AnyAtlas, RMachine } from "r-machine";
import { type NextClientRMachine, type NextClientToolset, NextStrategy } from "#r-machine/next/core";
import type { NextAppRouterImplProvider, NextAppRouterServerToolset } from "#r-machine/next/core/app-router";

interface NextToolsetBuilder {
  createClient<A extends AnyAtlas>(rMachine: RMachine<A>, strategy: NextStrategy<any>): NextClientToolset<A>;

  createServer<A extends AnyAtlas, LK extends string>(
    rMachine: RMachine<A>,
    strategy: NextAppRouterImplProvider<any, LK>,
    NextClientRMachine: NextClientRMachine
  ): NextAppRouterServerToolset<A, LK>;
}

export const NextToolset: NextToolsetBuilder = {
  createClient: (rMachine, strategy) => {
    return NextStrategy.createClientToolset(rMachine, strategy);
  },

  createServer: (rMachine, strategy, NextClientRMachine) => {
    return NextStrategy.createServerToolset(rMachine, strategy, NextClientRMachine);
  },
};
