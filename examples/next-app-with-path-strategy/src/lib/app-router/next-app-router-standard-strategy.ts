import {
  NextAppRouterCustomStrategy,
  type PartialNextAppRouterCustomClientImpl,
  type PartialNextAppRouterCustomServerImpl,
} from "./next-app-router-custom-strategy";

const standardLocaleKey = "locale" as const;
type StandardLocaleKey = typeof standardLocaleKey;

interface PartialNextAppRouterStandardStrategyConfig {
  readonly basePath?: string;
  readonly lowercaseLocale?: boolean;
  readonly clientImpl?: PartialNextAppRouterCustomClientImpl<StandardLocaleKey>;
  readonly serverImpl?: PartialNextAppRouterCustomServerImpl<StandardLocaleKey>;
}

export class NextAppRouterStandardStrategy extends NextAppRouterCustomStrategy<StandardLocaleKey> {
  constructor();
  constructor(config: PartialNextAppRouterStandardStrategyConfig);
  constructor(config?: PartialNextAppRouterStandardStrategyConfig) {
    super({
      ...config,
      localeKey: standardLocaleKey,
    });
  }
}
