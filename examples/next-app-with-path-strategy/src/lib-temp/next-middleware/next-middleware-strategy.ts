/*
import type { AnyAtlas, RMachine } from "r-machine";
import { NextStrategy } from "../next-strategy";
import type { NextMiddlewareStrategyImpl } from "./next-middleware-strategy-impl";

export abstract class NextMiddlewareStrategy<SC> extends NextStrategy<SC, {}> {
  protected abstract getNextStrategyImpl(): NextMiddlewareStrategyImpl;

  static getNextStrategyImpl(
    strategy: NextMiddlewareStrategy,
    rMachine: RMachine<AnyAtlas>
  ): NextMiddlewareStrategyImpl {
    return strategy.getNextStrategyImpl(rMachine);
  }
}
*/
