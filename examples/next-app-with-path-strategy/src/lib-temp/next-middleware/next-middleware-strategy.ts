import type { AnyAtlas, RMachine } from "r-machine";
import type { NextMiddlewareStrategyImpl } from "./next-middleware-strategy-impl";
import { NextStrategy } from "./next-strategy";

export abstract class NextMiddlewareStrategy extends NextStrategy {
  protected abstract getNextStrategyImpl(rMachine: RMachine<AnyAtlas>): NextMiddlewareStrategyImpl;

  static getNextStrategyImpl(
    strategy: NextMiddlewareStrategy,
    rMachine: RMachine<AnyAtlas>
  ): NextMiddlewareStrategyImpl {
    return strategy.getNextStrategyImpl(rMachine);
  }
}
