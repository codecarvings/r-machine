import { type DefaultLocaleKey, NextAppImplProvider } from "#r-machine/next/core/app";
import {
  getCookieOption,
  NextAppWithCookieStrategy,
  type NextAppWithCookieStrategyConfig,
  type PartialNextAppWithCookieStrategyConfig,
} from "./next-app-with-cookie-strategy.js";

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

export interface NextAppPathStrategyConfig<LK extends string> extends NextAppWithCookieStrategyConfig<LK> {
  readonly lowercaseLocale: boolean;
  readonly implicitDefaultLocale: ImplicitDefaultLocale;
  readonly autoDetectLocale: AutoDetectLocale;
  readonly allowAutoLocaleBinding: boolean;
  readonly basePath: string;
}
export interface PartialNextAppPathStrategyConfig<LK extends string>
  extends PartialNextAppWithCookieStrategyConfig<LK> {
  readonly lowercaseLocale?: boolean;
  readonly implicitDefaultLocale?: ImplicitDefaultLocale;
  readonly autoDetectLocale?: AutoDetectLocale;
  readonly allowAutoLocaleBinding?: boolean;
  readonly basePath?: string;
}

const defaultConfig_explicit: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
  lowercaseLocale: true,
  implicitDefaultLocale: "off",
  autoDetectLocale: "on",
  allowAutoLocaleBinding: false,
  basePath: "",
  cookie: "off",
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
  cookie: "off",
};

function createConfigWithDefaults<LK extends string>(
  config: PartialNextAppPathStrategyConfig<LK>
): NextAppPathStrategyConfig<LK> {
  const baseConfig =
    config.implicitDefaultLocale === undefined || config.implicitDefaultLocale === "off"
      ? defaultConfig_explicit
      : defaultConfig_implicit;

  const cookie = getCookieOption(config.cookie ?? baseConfig.cookie);

  return {
    ...baseConfig,
    ...config,
    cookie,
  } as NextAppPathStrategyConfig<LK>;
}

export class NextAppPathStrategy<LK extends string = DefaultLocaleKey> extends NextAppWithCookieStrategy<
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
      }
    );
  }
}
