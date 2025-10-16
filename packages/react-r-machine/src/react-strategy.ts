import type { ReactStrategyImpl } from "./react-strategy-impl.js";

export abstract class ReactStrategy {
  protected abstract buildReactStrategyImpl(): ReactStrategyImpl;

  static buildReactStrategyImpl(strategy: ReactStrategy): ReactStrategyImpl {
    return strategy.buildReactStrategyImpl();
  }
}
