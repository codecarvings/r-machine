import type { ReactStrategyImpl, ReactStrategyImpl$Ext } from "./react-strategy-impl.js";

export abstract class ReactStrategy<SC, E extends ReactStrategyImpl$Ext> {
  constructor(protected readonly config: SC) {}

  static getConfig<SC>(strategy: ReactStrategy<SC, any>): SC {
    return strategy.config;
  }

  protected abstract getReactStrategyImpl(): ReactStrategyImpl<SC, E>;
  static getReactStrategyImpl<SC, E extends ReactStrategyImpl$Ext>(
    strategy: ReactStrategy<SC, E>
  ): ReactStrategyImpl<SC, E> {
    return strategy.getReactStrategyImpl();
  }
}
