import type { AnyAtlas, RMachine } from "r-machine";
import { type NextClientRMachine, type NextClientToolset, NextStrategy } from "#r-machine/next/core";
import type { NextAppRouterImplProvider, NextAppRouterServerToolset } from "#r-machine/next/core/app-router";
import type { NextProxyPathImplProvider, NextProxyPathServerToolset } from "#r-machine/next/core/proxy";

interface NextToolsetBuilder {
  createForClient<A extends AnyAtlas>(rMachine: RMachine<A>, strategy: NextStrategy<any>): NextClientToolset<A>;

  createForServer<A extends AnyAtlas, LK extends string>(
    rMachine: RMachine<A>,
    strategy: NextAppRouterImplProvider<any, LK>,
    NextClientRMachine: NextClientRMachine
  ): NextAppRouterServerToolset<A, LK>;
  createForServer<A extends AnyAtlas, LK extends string>(
    rMachine: RMachine<A>,
    strategy: NextProxyPathImplProvider<any, LK>,
    NextClientRMachine: NextClientRMachine
  ): NextProxyPathServerToolset<A, LK>;
}

export const NextToolset: NextToolsetBuilder = {
  createForClient: (rMachine, strategy) => {
    return NextStrategy.createClientToolset(rMachine, strategy);
  },

  createForServer: <A extends AnyAtlas>(
    rMachine: RMachine<A>,
    strategy: NextAppRouterImplProvider<any, any> | NextProxyPathImplProvider<any, any>,
    NextClientRMachine: NextClientRMachine
  ) => {
    return NextStrategy.createServerToolset(rMachine, strategy, NextClientRMachine);
  },
};
