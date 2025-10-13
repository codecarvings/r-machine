import type { AnyAtlas, RMachine } from "r-machine";
import type { ReactStrategyImpl } from "./react-strategy-impl.js";

export abstract class ReactStrategy {
  protected abstract getReactStrategyImpl(rMachine: RMachine<AnyAtlas>): ReactStrategyImpl;

  static getReactStrategyImpl(strategy: ReactStrategy, rMachine: RMachine<AnyAtlas>): ReactStrategyImpl {
    return strategy.getReactStrategyImpl(rMachine);
  }
}
