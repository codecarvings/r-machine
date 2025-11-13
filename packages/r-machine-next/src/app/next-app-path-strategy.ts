import type { SwitchableOption } from "r-machine/strategy";
import { type DefaultLocaleKey, NextAppImplProvider } from "#r-machine/next/core/app";
import {
  NextAppPersistentStrategy,
  type NextAppPersistentStrategyConfig,
  type PartialNextAppPersistentStrategyConfig,
} from "./next-app-persistent-strategy.js";

interface CustomImplicitDefaultLocale {
  readonly pathMatcherRegExp: RegExp | null;
}
type ImplicitDefaultLocaleOption = SwitchableOption | CustomImplicitDefaultLocale;

interface CustomAutoDetectLocale {
  readonly pathMatcherRegExp: RegExp | null;
}
type AutoDetectLocaleOption = SwitchableOption | CustomAutoDetectLocale;

export interface NextAppPathStrategyConfig<LK extends string> extends NextAppPersistentStrategyConfig<LK> {
  readonly lowercaseLocale: SwitchableOption;
  readonly autoDetectLocale: AutoDetectLocaleOption;
  readonly implicitDefaultLocale: ImplicitDefaultLocaleOption;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export interface PartialNextAppPathStrategyConfig<LK extends string>
  extends PartialNextAppPersistentStrategyConfig<LK> {
  readonly lowercaseLocale?: SwitchableOption;
  readonly autoDetectLocale?: AutoDetectLocaleOption;
  readonly implicitDefaultLocale?: ImplicitDefaultLocaleOption;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

const defaultConfig: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  localeKey: NextAppImplProvider.defaultLocaleKey,
  cookie: "off",
  lowercaseLocale: "on",
  autoDetectLocale: "on",
  implicitDefaultLocale: "off",
  autoLocaleBinding: "off",
  basePath: "",
};

export class NextAppPathStrategy<LK extends string = DefaultLocaleKey> extends NextAppPersistentStrategy<
  LK,
  NextAppPathStrategyConfig<LK>
> {
  constructor();
  constructor(config: PartialNextAppPathStrategyConfig<LK>);
  constructor(config: PartialNextAppPathStrategyConfig<LK> = {}) {
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
      }
    );
  }
}
