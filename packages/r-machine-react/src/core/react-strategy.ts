import type { AnyAtlas, RMachine } from "r-machine";
import { Strategy } from "r-machine/strategy";

export abstract class ReactStrategy<C> extends Strategy<C> {
  protected abstract createToolset<A extends AnyAtlas>(rMachine: RMachine<A>): any;
  static createToolset<A extends AnyAtlas, S extends ReactStrategy<any>>(rMachine: RMachine<A>, strategy: S) {
    return strategy.createToolset(rMachine);
  }
}
