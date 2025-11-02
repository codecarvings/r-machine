import { type DefaultLocaleKey, NextAppImplProvider } from "#r-machine/next/core/app";

export type NextAppFlatStrategyConfig<LK extends string = DefaultLocaleKey> = {
  readonly localeKey: LK;
};
export type PartialNextAppFlatStrategyConfig<LK extends string = DefaultLocaleKey> = Partial<
  NextAppFlatStrategyConfig<LK>
>;

const defaultConfig: NextAppFlatStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
};

export class NextAppFlatStrategy<LK extends string = DefaultLocaleKey> extends NextAppImplProvider<
  LK,
  NextAppFlatStrategyConfig<LK>
> {
  constructor(config: PartialNextAppFlatStrategyConfig<LK>) {
    super(
      {
        ...defaultConfig,
        ...config,
      } as NextAppFlatStrategyConfig<LK>,
      undefined!,
      undefined!,
      (config.localeKey ?? NextAppImplProvider.defaultLocaleKey) as LK
    );
  }
}
