import type { CookieDeclaration } from "r-machine/strategy";
import { type DefaultLocaleKey, NextAppImplProvider } from "#r-machine/next/core/app";

type ImplicitDefaultLocale =
  | "off"
  | "on"
  | {
      readonly pathMatcherRegExp: RegExp;
    };

type AutoDetectLocale =
  | "off"
  | "on"
  | {
      readonly pathMatcherRegExp: RegExp;
    };

export interface NextAppPathStrategyConfig<LK extends string = DefaultLocaleKey> {
  readonly localeKey: LK;
  readonly lowercaseLocale: boolean;
  readonly implicitDefaultLocale: ImplicitDefaultLocale;
  readonly autoDetectLocale: AutoDetectLocale;
  readonly allowAutoLocaleBinding: boolean;
  readonly basePath: string;
  readonly cookie: "off" | CookieDeclaration;
}
export interface PartialNextAppPathStrategyConfig<LK extends string = DefaultLocaleKey> {
  readonly localeKey?: LK;
  readonly lowercaseLocale?: boolean;
  readonly implicitDefaultLocale?: ImplicitDefaultLocale;
  readonly autoDetectLocale?: AutoDetectLocale;
  readonly allowAutoLocaleBinding?: boolean;
  readonly basePath?: string;
  readonly cookie?: "off" | "on" | CookieDeclaration;
}

const defaultCookieDeclaration: CookieDeclaration = {
  name: "rm-locale",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

const defaultConfig_explicit: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
  lowercaseLocale: true,
  implicitDefaultLocale: "off",
  autoDetectLocale: "on",
  allowAutoLocaleBinding: false,
  basePath: "",
  cookie: defaultCookieDeclaration,
};

const defaultConfig_implicit: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
  lowercaseLocale: true,
  implicitDefaultLocale: {
    pathMatcherRegExp: /^\/(?!(?:_next|_vercel|api)(?:\/|$)|.*\.[^/]+$)/,
  },
  autoDetectLocale: {
    pathMatcherRegExp: /^\/$/,
  },
  allowAutoLocaleBinding: false,
  basePath: "",
  cookie: defaultCookieDeclaration,
};

function createConfigWithDefaults<LK extends string>(
  config: PartialNextAppPathStrategyConfig<LK>
): NextAppPathStrategyConfig<LK> {
  const baseConfig =
    config.implicitDefaultLocale === undefined || config.implicitDefaultLocale === "off"
      ? defaultConfig_explicit
      : defaultConfig_implicit;

  let cookie: "off" | CookieDeclaration;
  if (config.cookie === "off") {
    cookie = "off";
  } else if (config.cookie === undefined || config.cookie === "on") {
    cookie = defaultCookieDeclaration;
  } else {
    cookie = config.cookie;
  }

  return {
    ...baseConfig,
    ...config,
    cookie,
  } as NextAppPathStrategyConfig<LK>;
}

export class NextAppPathStrategy<LK extends string = DefaultLocaleKey> extends NextAppImplProvider<
  LK,
  NextAppPathStrategyConfig<LK>
> {
  constructor();
  constructor(config: PartialNextAppPathStrategyConfig<LK>);
  constructor(config: PartialNextAppPathStrategyConfig<LK> = {}) {
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
