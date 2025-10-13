import { NextAppRouterStrategy, type NextAppRouterStrategyConfig } from "../next-app-router-strategy";
import { nextAppRouterDefaultStrategyConfig } from "./next-app-router-default-strategy";

type NextAppRouterPartialStrategyConfig<LK extends string> = Partial<NextAppRouterStrategyConfig<LK>> & {
  localeKey: LK;
};

const defaultConfig: NextAppRouterStrategyConfig<string> = {
  ...nextAppRouterDefaultStrategyConfig,
  localeKey: undefined!,
};

export class NextAppRouterCustomStrategy<LK extends string> extends NextAppRouterStrategy<LK> {
  constructor(config: NextAppRouterPartialStrategyConfig<LK>) {
    super({ ...defaultConfig, ...config });
  }
}
