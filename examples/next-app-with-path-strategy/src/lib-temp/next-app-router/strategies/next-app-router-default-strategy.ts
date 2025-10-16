import {
  NextAppRouterCustomStrategy,
  type PartialNextAppRouterCustomStrategyClientImpl,
  type PartialNextAppRouterCustomStrategyServerImpl,
} from "./next-app-router-custom-strategy";

const defaultLocaleKey = "locale" as const;
type DefaultLocaleKey = typeof defaultLocaleKey;

interface PartialNextAppRouterDefaultStrategyConfig {
  readonly basePath?: string;
  readonly lowercaseLocale?: boolean;
  readonly serverImpl?: PartialNextAppRouterCustomStrategyServerImpl<DefaultLocaleKey>;
  readonly clientImpl?: PartialNextAppRouterCustomStrategyClientImpl<DefaultLocaleKey>;
}

export class NextAppRouterDefaultStrategy extends NextAppRouterCustomStrategy<DefaultLocaleKey> {
  constructor();
  constructor(config: PartialNextAppRouterDefaultStrategyConfig);
  constructor(config?: PartialNextAppRouterDefaultStrategyConfig) {
    super({
      ...config,
      localeKey: defaultLocaleKey,
    });
  }
}
