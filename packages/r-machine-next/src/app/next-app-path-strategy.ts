import { type DefaultLocaleKey, NextAppImplProvider } from "#r-machine/next/core/app";

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
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-path-impl.client.js");
        return module.nextAppPathImpl_clientFactory(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-path-impl.server.js");
        return module.nextAppPathImpl_serverFactory(rMachine, strategyConfig);
      },
      (config.localeKey ?? NextAppImplProvider.defaultLocaleKey) as LK
    );
  }
}
