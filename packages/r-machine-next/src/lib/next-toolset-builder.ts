import type { AnyAtlas, RMachine } from "r-machine";
import {
  type NextClientPathToolset,
  type NextClientPlainToolset,
  type NextClientRMachine,
  NextStrategy,
} from "#r-machine/next/core";
import type { NextAppServerPathToolset, NextAppServerPlainToolset, NextAppStrategy } from "#r-machine/next/core/app";

interface NextToolsetBuilder {
  createForClient<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    strategy: NextStrategy<"plain", any>
  ): Promise<NextClientPlainToolset<A>>;
  createForClient<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    strategy: NextStrategy<"path", any>
  ): Promise<NextClientPathToolset<A>>;

  createForServer<A extends AnyAtlas, LK extends string>(
    rMachine: RMachine<A>,
    strategy: NextAppStrategy<"plain", LK, any>,
    NextClientRMachine: NextClientRMachine
  ): Promise<NextAppServerPlainToolset<LK, A>>;
  createForServer<A extends AnyAtlas, LK extends string>(
    rMachine: RMachine<A>,
    strategy: NextAppStrategy<"path", LK, any>,
    NextClientRMachine: NextClientRMachine
  ): Promise<NextAppServerPathToolset<LK, A>>;
}

export const NextToolset: NextToolsetBuilder = {
  createForClient: (rMachine, strategy) => {
    return NextStrategy.createClientToolset(rMachine, strategy);
  },

  createForServer: (rMachine, strategy, NextClientRMachine) => {
    return NextStrategy.createServerToolset(rMachine, strategy, NextClientRMachine);
  },
};
