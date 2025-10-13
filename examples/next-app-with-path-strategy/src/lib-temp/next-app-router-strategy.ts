import type { AnyAtlas, RMachine } from "r-machine";
import type { ReactStrategyImpl } from "react-r-machine";
import type { NextAppRouterStrategyImpl } from "./next-app-router-strategy-impl.js";
import { NextStrategy } from "./next-strategy.js";

export interface NextAppRouterStrategyConfig<LK extends string> {
  readonly localeKey: LK;
  readonly basePath: string;
  readonly lowercaseLocale: boolean;
}

export abstract class NextAppRouterStrategy<LK extends string> extends NextStrategy {
  protected constructor(config: NextAppRouterStrategyConfig<LK>) {
    super();
    this.config = { ...config };
  }

  readonly config: NextAppRouterStrategyConfig<LK>;

  protected getReactStrategyImpl(rMachine: RMachine<AnyAtlas>): ReactStrategyImpl {
    return undefined!;
  }

  protected getNextStrategyImpl(rMachine: RMachine<AnyAtlas>): NextAppRouterStrategyImpl {
    return undefined!;
  }

  static getNextStrategyImpl(
    strategy: NextAppRouterStrategy<any>,
    rMachine: RMachine<AnyAtlas>
  ): NextAppRouterStrategyImpl {
    return strategy.getNextStrategyImpl(rMachine);
  }
}
