import { NextAppRouterStrategy, type NextAppRouterStrategyConfig } from "../next-app-router-strategy.js";

const defaultLocaleKey = "locale" as const;
type DefaultLocaleKey = typeof defaultLocaleKey;

export const nextAppRouterDefaultStrategyConfig: NextAppRouterStrategyConfig<DefaultLocaleKey> = {
  localeKey: defaultLocaleKey,
  basePath: "",
  lowercaseLocale: true,
};

export class NextAppRouterDefaultStrategy extends NextAppRouterStrategy<DefaultLocaleKey> {
  constructor() {
    super(nextAppRouterDefaultStrategyConfig);
  }
}
