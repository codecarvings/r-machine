import type { SwitchableOption } from "r-machine/strategy";
import {
  type DefaultLocaleKey,
  NextAppPersistentStrategy,
  type NextAppPersistentStrategyConfig,
  type PartialNextAppPersistentStrategyConfig,
} from "#r-machine/next/core/app";

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
}
export interface PartialNextAppPathStrategyConfig<LK extends string>
  extends PartialNextAppPersistentStrategyConfig<LK> {
  readonly lowercaseLocale?: SwitchableOption;
  readonly autoDetectLocale?: AutoDetectLocaleOption;
  readonly implicitDefaultLocale?: ImplicitDefaultLocaleOption;
}

const defaultConfig: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  ...NextAppPersistentStrategy.defaultConfig,
  lowercaseLocale: "on",
  autoDetectLocale: "on",
  implicitDefaultLocale: "off",
};

export class NextAppPathStrategy<LK extends string = DefaultLocaleKey> extends NextAppPersistentStrategy<
  LK,
  NextAppPathStrategyConfig<LK>
> {
  static override readonly defaultConfig = defaultConfig;

  constructor();
  constructor(config: PartialNextAppPathStrategyConfig<LK>);
  constructor(config: PartialNextAppPathStrategyConfig<LK> = {}) {
    super(
      {
        ...defaultConfig,
        ...config,
      } as NextAppPathStrategyConfig<LK>,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-path.client-impl-complement.js");
        return module.createNextAppPathClientImplComplement(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-path.server-impl-complement.js");
        return module.createNextAppPathServerImplComplement(rMachine, strategyConfig);
      }
    );
  }
}
