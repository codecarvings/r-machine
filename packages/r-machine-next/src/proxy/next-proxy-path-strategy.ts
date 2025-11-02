import type { NextClientImpl } from "#r-machine/next/core";
import { NextProxyPathImplProvider, type NextProxyServerImpl } from "#r-machine/next/core/proxy";

const defaultLocaleKey = "locale" as const;
type DefaultLocaleKey = typeof defaultLocaleKey;

export interface NextProxyPathStrategyConfig<LK extends string = DefaultLocaleKey> {
  readonly localeKey: LK;
  readonly lowercaseLocale: boolean;
}
export type PartialNextProxyPathStrategyConfig<LK extends string = DefaultLocaleKey> = Partial<
  NextProxyPathStrategyConfig<LK>
>;

const defaultConfig: NextProxyPathStrategyConfig = {
  localeKey: defaultLocaleKey,
  lowercaseLocale: true,
};

const nextProxyPathImpl_client: any = undefined!;
const nextProxyPathImpl_server: any = undefined!;

export class NextProxyPathStrategy<LK extends string = DefaultLocaleKey> extends NextProxyPathImplProvider<
  NextProxyPathStrategyConfig<LK>,
  LK
> {
  constructor(config: PartialNextProxyPathStrategyConfig) {
    super(
      {
        ...defaultConfig,
        ...config,
      } as NextProxyPathStrategyConfig<LK>,
      nextProxyPathImpl_client as NextClientImpl<NextProxyPathStrategyConfig<LK>>,
      nextProxyPathImpl_server as NextProxyServerImpl<NextProxyPathStrategyConfig<LK>>,
      (config.localeKey ?? defaultLocaleKey) as LK
    );
  }
}
