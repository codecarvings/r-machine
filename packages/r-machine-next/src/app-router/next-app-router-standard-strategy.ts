import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import { NextAppRouterImplProvider, type NextAppRouterServerImpl } from "#r-machine/next/core/app-router";
import { nextAppRouterStandardImpl_clientFactory } from "./next-app-router-standard-impl.client.js";
import { nextAppRouterStandardImpl_serverFactory } from "./next-app-router-standard-impl.server.js";

const defaultLocaleKey = "locale" as const;
type DefaultLocaleKey = typeof defaultLocaleKey;

export interface NextAppRouterStandardStrategyConfig<LK extends string = DefaultLocaleKey> {
  readonly localeKey: LK;
  readonly lowercaseLocale: boolean;
}
export type PartialNextAppRouterStandardStrategyConfig<LK extends string = DefaultLocaleKey> = Partial<
  NextAppRouterStandardStrategyConfig<LK>
>;

const defaultConfig: NextAppRouterStandardStrategyConfig<DefaultLocaleKey> = {
  localeKey: defaultLocaleKey,
  lowercaseLocale: true,
};

export class NextAppRouterStandardStrategy<LK extends string = DefaultLocaleKey> extends NextAppRouterImplProvider<
  LK,
  NextAppRouterStandardStrategyConfig<LK>
> {
  constructor(config: PartialNextAppRouterStandardStrategyConfig<LK>) {
    super(
      {
        ...defaultConfig,
        ...config,
      } as NextAppRouterStandardStrategyConfig<LK>,
      nextAppRouterStandardImpl_clientFactory as ImplFactory<NextClientImpl, NextAppRouterStandardStrategyConfig<LK>>,
      nextAppRouterStandardImpl_serverFactory as ImplFactory<
        NextAppRouterServerImpl,
        NextAppRouterStandardStrategyConfig<LK>
      >,
      (config.localeKey ?? defaultLocaleKey) as LK
    );
  }
}
