import { type DefaultLocaleKey, NextAppImplProvider } from "#r-machine/next/core/app";

interface ImplicitDefaultLocaleOptions {
  pathRegexp: RegExp;
  autoDetectLocalePathRegexp: RegExp;
}

export interface NextAppPathStrategyConfig<LK extends string = DefaultLocaleKey> {
  readonly localeKey: LK;
  readonly lowercaseLocale: boolean;
  readonly implicitDefaultLocale: false | ImplicitDefaultLocaleOptions;
  readonly allowAutoLocaleBinding: boolean;
  readonly basePath: string;
  readonly cookie: any;
}
export type PartialNextAppPathStrategyConfig<LK extends string = DefaultLocaleKey> = Partial<
  Omit<NextAppPathStrategyConfig<LK>, "implicitDefaultLocale"> & {
    readonly implicitDefaultLocale?: boolean | Partial<ImplicitDefaultLocaleOptions>;
  }
>;

const defaultConfig: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
  lowercaseLocale: true,
  implicitDefaultLocale: {
    pathRegexp: /^\/(?!(?:api|_next|_vercel)(?:\/|$)|.*\.[^/]+$)/,
    autoDetectLocalePathRegexp: /^\/$/,
  },
  allowAutoLocaleBinding: true,
  basePath: "",
  cookie: undefined,
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
