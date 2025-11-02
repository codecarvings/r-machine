import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import { type DefaultLocaleKey, NextAppImplProvider, type NextAppServerImpl } from "#r-machine/next/core/app";
import { nextAppPathImpl_clientFactory } from "./next-app-path-impl.client.js";
import { nextAppPathImpl_serverFactory } from "./next-app-path-impl.server.js";

export interface NextAppPathStrategyConfig<LK extends string = DefaultLocaleKey> {
  readonly localeKey: LK;
  readonly lowercaseLocale: boolean;
}
export type PartialNextAppPathStrategyConfig<LK extends string = DefaultLocaleKey> = Partial<
  NextAppPathStrategyConfig<LK>
>;

const defaultConfig: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
  lowercaseLocale: true,
};

export class NextAppPathStrategy<LK extends string = DefaultLocaleKey> extends NextAppImplProvider<
  LK,
  NextAppPathStrategyConfig<LK>
> {
  constructor(config: PartialNextAppPathStrategyConfig<LK>) {
    super(
      {
        ...defaultConfig,
        ...config,
      } as NextAppPathStrategyConfig<LK>,
      nextAppPathImpl_clientFactory as ImplFactory<NextClientImpl, NextAppPathStrategyConfig<LK>>,
      nextAppPathImpl_serverFactory as ImplFactory<NextAppServerImpl, NextAppPathStrategyConfig<LK>>,
      (config.localeKey ?? NextAppImplProvider.defaultLocaleKey) as LK
    );
  }
}
