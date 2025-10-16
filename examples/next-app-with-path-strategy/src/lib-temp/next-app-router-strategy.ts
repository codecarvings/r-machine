import type { NextAppRouterStrategyClientImpl } from "./next-app-router-strategy-client-impl";
import type { NextAppRouterStrategyServerImpl } from "./next-app-router-strategy-server-impl";
import { NextStrategy } from "./next-strategy";

export abstract class NextAppRouterStrategy extends NextStrategy {
  protected abstract getNextStrategyServerImpl(): NextAppRouterStrategyServerImpl;
  static getNextStrategyServerImpl(strategy: NextAppRouterStrategy): NextAppRouterStrategyServerImpl {
    return strategy.getNextStrategyServerImpl();
  }

  protected abstract getNextStrategyClientImpl(): NextAppRouterStrategyClientImpl;
  static getNextStrategyClientImpl(strategy: NextAppRouterStrategy): NextAppRouterStrategyClientImpl {
    return strategy.getNextStrategyClientImpl();
  }

  protected getReactStrategyImpl() {
    return this.getNextStrategyClientImpl();
  }
}
