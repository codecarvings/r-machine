import type { NextClientImpl } from "#r-machine/next/core";
import { NextAppRouterImplProvider, type NextAppRouterServerImpl } from "#r-machine/next/core/app-router";
import { nextAppRouterStandardImpl_client } from "./next-app-router-standard-impl.client.js";
import { nextAppRouterStandardImpl_server } from "./next-app-router-standard-impl.server.js";

const defaultLocaleKey = "locale" as const;
type DefaultLocaleKey = typeof defaultLocaleKey;

export interface NextAppRouterStandardStrategyConfig<LK extends string = DefaultLocaleKey> {
  readonly localeKey: LK;
  readonly basePath: string;
  readonly lowercaseLocale: boolean;
}
export type PartialNextAppRouterStandardStrategyConfig<LK extends string = DefaultLocaleKey> = Partial<
  NextAppRouterStandardStrategyConfig<LK>
>;

const defaultConfig: NextAppRouterStandardStrategyConfig<DefaultLocaleKey> = {
  localeKey: defaultLocaleKey,
  basePath: "",
  lowercaseLocale: true,
};

export class NextAppRouterStandardStrategy<LK extends string = DefaultLocaleKey> extends NextAppRouterImplProvider<
  NextAppRouterStandardStrategyConfig<LK>,
  LK
> {
  constructor(config: PartialNextAppRouterStandardStrategyConfig<LK>) {
    super(
      {
        ...defaultConfig,
        ...config,
      } as NextAppRouterStandardStrategyConfig<LK>,
      nextAppRouterStandardImpl_client as NextClientImpl<NextAppRouterStandardStrategyConfig<LK>>,
      nextAppRouterStandardImpl_server as NextAppRouterServerImpl<NextAppRouterStandardStrategyConfig<LK>>,
      (config.localeKey ?? defaultLocaleKey) as LK
    );
  }
}
