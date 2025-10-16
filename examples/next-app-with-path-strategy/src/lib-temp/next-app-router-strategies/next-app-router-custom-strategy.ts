import { NextAppRouterStrategy } from "../next-app-router-strategy";
import type { NextAppRouterStrategyClientImpl } from "../next-app-router-strategy-client-impl";
import type { NextAppRouterStrategyServerImpl } from "../next-app-router-strategy-server-impl";

interface NextAppRouterCustomStrategyBaseConfig<LK extends string> {
  readonly localeKey: LK;
  readonly basePath: string;
  readonly lowercaseLocale: boolean;
}

interface NextAppRouterCustomStrategyConfig<LK extends string> extends NextAppRouterCustomStrategyBaseConfig<LK> {
  readonly serverImplFactory: NextAppRouterStrategyServerImplFactory<LK>;
  readonly clientImplFactory: NextAppRouterStrategyClientImplFactory<LK>;
}

type NextAppRouterStrategyServerImplFactory<LK extends string> = (
  config: NextAppRouterCustomStrategyBaseConfig<LK>
) => NextAppRouterStrategyServerImpl;

type NextAppRouterStrategyClientImplFactory<LK extends string> = (
  config: NextAppRouterCustomStrategyBaseConfig<LK>
) => NextAppRouterStrategyClientImpl;

interface PartialNextAppRouterCustomStrategyConfig<LK extends string> {
  readonly localeKey: LK;
  readonly basePath?: string;
  readonly lowercaseLocale?: boolean;
  readonly serverImpl?: PartialNextAppRouterCustomStrategyServerImpl | PartialNextAppRouterCustomStrategyServerImplFactory<LK>;
  readonly clientImpl?: PartialNextAppRouterCustomStrategyClientImpl | PartialNextAppRouterCustomStrategyClientImplFactory<LK>;
};

type PartialNextAppRouterCustomStrategyServerImpl = Partial<NextAppRouterStrategyServerImpl>;
type PartialNextAppRouterCustomStrategyServerImplFactory<LK extends string> = (
  config: NextAppRouterCustomStrategyConfig<LK>
) => PartialNextAppRouterCustomStrategyServerImpl;

type PartialNextAppRouterCustomStrategyClientImpl = Partial<NextAppRouterStrategyClientImpl>;
type PartialNextAppRouterCustomStrategyClientImplFactory<LK extends string> = (
  config: NextAppRouterCustomStrategyConfig<LK>
) => PartialNextAppRouterCustomStrategyClientImpl;

const defaultConfig: NextAppRouterCustomStrategyConfig<string> = {
  localeKey: undefined!,
  basePath: "",
  lowercaseLocale: true,
  serverImpl: undefined!,
  clientImpl: undefined!,
};

export class NextAppRouterCustomStrategy<LK extends string> extends NextAppRouterStrategy {
  constructor(config: PartialNextAppRouterCustomStrategyConfig<LK>) {
    super();
    this.config = {
      ...defaultConfig,
      serverImpl: { ...defaultConfig.serverImpl, ...config?.serverImpl },
      clientImpl: { ...defaultConfig.clientImpl, ...config?.clientImpl },
    } as NextAppRouterCustomStrategyConfig<LK>;
  }

  protected readonly config: NextAppRouterCustomStrategyConfig<LK>;

  protected getNextStrategyServerImpl(): NextAppRouterStrategyServerImpl {
    return this.config.serverImpl;
  }

  protected getNextStrategyClientImpl(): NextAppRouterStrategyClientImpl {
    return this.config.clientImpl;
  }
}
}
}
