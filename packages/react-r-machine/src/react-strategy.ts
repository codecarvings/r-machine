import type { AnyAtlas, RMachine } from "r-machine";
import type { ReactStrategyImpl } from "./react-strategy-impl.js";

export abstract class ReactStrategy {
  protected abstract getReactStrategyImpl<A extends AnyAtlas>(rMachine: RMachine<A>): ReactStrategyImpl;

  static getReactStrategyImpl<A extends AnyAtlas>(strategy: ReactStrategy, rMachine: RMachine<A>): ReactStrategyImpl {
    return strategy.getReactStrategyImpl(rMachine);
  }
}
