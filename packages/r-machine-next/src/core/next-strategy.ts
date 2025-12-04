import type { AnyAtlas, RMachine } from "r-machine";
import { Strategy } from "r-machine/strategy";
import type { NextClientRMachine } from "./next-client-toolset.js";

export type NextStrategyKind = "plain" | "path";

export type AnyNextPathStrategy = NextStrategy<"path", any>;
export type AnyNextPlainStrategy = NextStrategy<"plain", any>;

export abstract class NextStrategy<SK extends NextStrategyKind, C> extends Strategy<C> {
  constructor(
    protected readonly kind: SK,
    config: C
  ) {
    super(config);
  }

  // Must use any because TS is not able to infer generic function return types
  // The correct types are enforced in NextToolsetBuilder
  protected abstract createClientToolset<A extends AnyAtlas>(rMachine: RMachine<A>): Promise<any>;
  static createClientToolset<A extends AnyAtlas, S extends NextStrategy<any, any>>(rMachine: RMachine<A>, strategy: S) {
    return strategy.createClientToolset(rMachine);
  }

  // Must use any because TS is not able to infer generic function return types
  // The correct types are enforced in NextToolsetBuilder
  protected abstract createServerToolset<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    NextClientRMachine: NextClientRMachine
  ): Promise<any>;
  static createServerToolset<A extends AnyAtlas, S extends NextStrategy<any, any>>(
    rMachine: RMachine<A>,
    strategy: S,
    NextClientRMachine: NextClientRMachine
  ) {
    return strategy.createServerToolset(rMachine, NextClientRMachine);
  }
}
