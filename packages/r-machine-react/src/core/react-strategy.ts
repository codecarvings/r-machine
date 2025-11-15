import type { AnyAtlas, RMachine } from "r-machine";
import { Strategy } from "r-machine/strategy";

export abstract class ReactStrategy<C> extends Strategy<C> {
  // Must use any because TS is not able to infer generic function return types
  // The correct types are enforced in ReactToolsetBuilder
  protected abstract createToolset<A extends AnyAtlas>(rMachine: RMachine<A>): Promise<any>;
  static createToolset<A extends AnyAtlas, S extends ReactStrategy<any>>(rMachine: RMachine<A>, strategy: S) {
    return strategy.createToolset(rMachine);
  }
}
