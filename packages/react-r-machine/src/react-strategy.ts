import type { ReactStrategyImpl } from "./react-strategy-impl.js";

export abstract class ReactStrategy<SC> {
  constructor(protected readonly config: SC) {}

  static getConfig<SC>(strategy: ReactStrategy<SC>): SC {
    return strategy.config;
  }

  protected abstract getReactStrategyImpl(): ReactStrategyImpl<SC>;
  static getReactStrategyImpl<SC>(strategy: ReactStrategy<SC>): ReactStrategyImpl<SC> {
    return strategy.getReactStrategyImpl();
  }
}
