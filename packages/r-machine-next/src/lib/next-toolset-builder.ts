import type { AnyAtlas, RMachine } from "r-machine";
import { type NextClientRMachine, type NextClientToolset, NextStrategy } from "#r-machine/next/core";
import type { NextAppRouterImplProvider, NextAppRouterServerToolset } from "#r-machine/next/core/app-router";

interface NextToolsetBuilder {
  createForClient<A extends AnyAtlas>(rMachine: RMachine<A>, strategy: NextStrategy<any>): NextClientToolset<A>;

  createForServer<A extends AnyAtlas, LK extends string>(
    rMachine: RMachine<A>,
    strategy: NextAppRouterImplProvider<LK, any>,
    NextClientRMachine: NextClientRMachine
  ): NextAppRouterServerToolset<A, LK>;
}

export const NextToolset: NextToolsetBuilder = {
  createForClient: (rMachine, strategy) => {
    return NextStrategy.createClientToolset(rMachine, strategy);
  },

  createForServer: <A extends AnyAtlas>(
    rMachine: RMachine<A>,
    strategy: NextAppRouterImplProvider<any, any>,
    NextClientRMachine: NextClientRMachine
  ) => {
    return NextStrategy.createServerToolset(rMachine, strategy, NextClientRMachine);
  },
};
