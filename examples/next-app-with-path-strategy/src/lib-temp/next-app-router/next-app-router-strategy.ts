import { NextStrategy } from "../next-strategy";
import type { NextAppRouterStrategyClientImpl } from "./next-app-router-strategy-client-impl";
import type { NextAppRouterStrategyServerImpl } from "./next-app-router-strategy-server-impl";

export abstract class NextAppRouterStrategy<SC, LK extends string> extends NextStrategy<SC> {
  protected abstract getNextStrategyServerImpl(): NextAppRouterStrategyServerImpl<SC>;
  static getNextStrategyServerImpl<SC, LK extends string>(
    strategy: NextAppRouterStrategy<SC, LK>
  ): NextAppRouterStrategyServerImpl<SC> {
    return strategy.getNextStrategyServerImpl();
  }

  protected abstract getNextStrategyClientImpl(): NextAppRouterStrategyClientImpl<SC>;
  static getNextStrategyClientImpl<SC, LK extends string>(
    strategy: NextAppRouterStrategy<SC, LK>
  ): NextAppRouterStrategyClientImpl<SC> {
    return strategy.getNextStrategyClientImpl();
  }

  protected abstract getLocaleKey(): LK;
  static getLocaleKey<SC, LK extends string>(strategy: NextAppRouterStrategy<SC, LK>): LK {
    return strategy.getLocaleKey();
  }

  protected getReactStrategyImpl() {
    return this.getNextStrategyClientImpl();
  }
}
