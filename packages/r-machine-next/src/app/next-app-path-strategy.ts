import { type DefaultLocaleKey, NextAppImplProvider } from "#r-machine/next/core/app";
import {
  getCookieOption,
  NextAppPersistentStrategy,
  type NextAppPersistentStrategyConfig,
  type PartialNextAppPersistentStrategyConfig,
} from "./next-app-persistent-strategy.js";

type ImplicitDefaultLocale =
  | "off"
  | "on"
  | {
      readonly pathMatcherRegExp: RegExp | null;
    };

type AutoDetectLocale =
  | "off"
  | "on"
  | {
      readonly pathMatcherRegExp: RegExp | null;
    };

export interface NextAppPathStrategyConfig<LK extends string> extends NextAppPersistentStrategyConfig<LK> {
  readonly lowercaseLocale: boolean;
  readonly implicitDefaultLocale: ImplicitDefaultLocale;
  readonly autoDetectLocale: AutoDetectLocale;
  readonly enableAutoLocaleBinding: boolean;
  readonly basePath: string;
}
export interface PartialNextAppPathStrategyConfig<LK extends string>
  extends PartialNextAppPersistentStrategyConfig<LK> {
  readonly lowercaseLocale?: boolean;
  readonly implicitDefaultLocale?: ImplicitDefaultLocale;
  readonly autoDetectLocale?: AutoDetectLocale;
  readonly enableAutoLocaleBinding?: boolean;
  readonly basePath?: string;
}

const defaultConfig: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
  lowercaseLocale: true,
  implicitDefaultLocale: "off",
  autoDetectLocale: "on",
  enableAutoLocaleBinding: false,
  basePath: "",
  cookie: "off",
};

function createConfigWithDefaults<LK extends string>(
  config: PartialNextAppPathStrategyConfig<LK>
): NextAppPathStrategyConfig<LK> {
  const cookie = getCookieOption(config.cookie ?? defaultConfig.cookie);

  return {
    ...defaultConfig,
    ...config,
    cookie,
  } as NextAppPathStrategyConfig<LK>;
}

export class NextAppPathStrategy<LK extends string = DefaultLocaleKey> extends NextAppPersistentStrategy<
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
