import type { AnyAtlas, RMachine } from "r-machine";
import { Strategy } from "r-machine/strategy";
import type { NextClientRMachine } from "./next-client-toolset.js";

export abstract class NextStrategy<C> extends Strategy<C> {
  // Must use any because TS is not able to infer generic function return types
  // The correct types are enforced in NextToolsetBuilder
  protected abstract createClientToolset<A extends AnyAtlas>(rMachine: RMachine<A>): any;
  static createClientToolset<A extends AnyAtlas, S extends NextStrategy<any>>(rMachine: RMachine<A>, strategy: S) {
    return strategy.createClientToolset(rMachine);
  }

  // Must use any because TS is not able to infer generic function return types
  // The correct types are enforced in NextToolsetBuilder
  protected abstract createServerToolset<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    NextClientRMachine: NextClientRMachine
  ): any;
  static createServerToolset<A extends AnyAtlas, S extends NextStrategy<any>>(
    rMachine: RMachine<A>,
    strategy: S,
    NextClientRMachine: NextClientRMachine
  ) {
    return strategy.createServerToolset(rMachine, NextClientRMachine);
  }
}
