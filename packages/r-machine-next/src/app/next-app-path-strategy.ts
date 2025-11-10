import type { CookieDeclaration } from "r-machine/strategy";
import { type DefaultLocaleKey, NextAppImplProvider } from "#r-machine/next/core/app";

interface ImplicitDefaultLocaleOptions {
  pathRegExp: RegExp;
  autoDetectLocalePathRegExp: RegExp;
}

export interface NextAppPathStrategyConfig<LK extends string = DefaultLocaleKey> {
  readonly localeKey: LK;
  readonly lowercaseLocale: boolean;
  readonly implicitDefaultLocale: false | ImplicitDefaultLocaleOptions;
  readonly allowAutoLocaleBinding: boolean;
  readonly basePath: string;
  readonly cookie: false | CookieDeclaration;
}
export type PartialNextAppPathStrategyConfig<LK extends string = DefaultLocaleKey> = Partial<
  Omit<NextAppPathStrategyConfig<LK>, "implicitDefaultLocale" | "cookie"> & {
    readonly implicitDefaultLocale?: boolean | ImplicitDefaultLocaleOptions;
    readonly cookie?: boolean | CookieDeclaration;
  }
>;

const defaultImplicitDefaultLocaleOptions: ImplicitDefaultLocaleOptions = {
  pathRegExp: /^\/(?!(?:api|_next|_vercel)(?:\/|$)|.*\.[^/]+$)/,
  autoDetectLocalePathRegExp: /^\/$/,
};
const defaultCookieDeclaration: CookieDeclaration = {
  name: "rm-locale",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

const defaultConfig: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
  lowercaseLocale: true,
  implicitDefaultLocale: false,
  allowAutoLocaleBinding: false,
  basePath: "",
  cookie: defaultCookieDeclaration,
};

function createConfigWithDefaults<LK extends string>(
  config: PartialNextAppPathStrategyConfig<LK>
): NextAppPathStrategyConfig<LK> {
  let implicitDefaultLocale: false | ImplicitDefaultLocaleOptions;
  if (config.implicitDefaultLocale === undefined || config.implicitDefaultLocale === false) {
    implicitDefaultLocale = false;
  } else if (config.implicitDefaultLocale === true) {
    implicitDefaultLocale = defaultImplicitDefaultLocaleOptions;
  } else {
    implicitDefaultLocale = config.implicitDefaultLocale;
  }

  let cookie: false | CookieDeclaration;
  if (config.cookie === undefined || config.cookie === false) {
    cookie = false;
  } else if (config.cookie === true) {
    cookie = defaultCookieDeclaration;
  } else {
    cookie = config.cookie;
  }

  return {
    ...defaultConfig,
    ...config,
    implicitDefaultLocale,
    cookie,
  } as NextAppPathStrategyConfig<LK>;
}

export class NextAppPathStrategy<LK extends string = DefaultLocaleKey> extends NextAppImplProvider<
  LK,
  NextAppPathStrategyConfig<LK>
> {
  constructor(config: PartialNextAppPathStrategyConfig<LK>) {
    super(
      createConfigWithDefaults(config),
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
