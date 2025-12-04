import type { AnyAtlas, RMachine } from "r-machine";
import {
  type DefaultLocaleKey,
  NextAppStrategy,
  type NextAppStrategyConfig,
  type PartialNextAppStrategyConfig,
} from "#r-machine/next/core/app";
import { defaultPathMatcher } from "#r-machine/next/internal";

export type LocaleOriginMap = {
  readonly [locale: string]: string | string[];
};

const defaultLocaleOriginMap: LocaleOriginMap = {};

export interface NextAppOriginStrategyConfig<LK extends string> extends NextAppStrategyConfig<LK> {
  readonly localeOriginMap: LocaleOriginMap;
  readonly pathMatcher: RegExp | null;
}
export interface PartialNextAppOriginStrategyConfig<LK extends string> extends PartialNextAppStrategyConfig<LK> {
  readonly localeOriginMap: LocaleOriginMap; // Required
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppOriginStrategyConfig<DefaultLocaleKey> = {
  ...NextAppStrategy.defaultConfig,
  localeOriginMap: defaultLocaleOriginMap,
  pathMatcher: defaultPathMatcher,
};

export class NextAppOriginStrategy<LK extends string = DefaultLocaleKey> extends NextAppStrategy<
  "plain",
  LK,
  NextAppOriginStrategyConfig<LK>
> {
  static override readonly defaultConfig = defaultConfig;

  constructor();
  constructor(config: PartialNextAppOriginStrategyConfig<LK>);
  constructor(
    config: PartialNextAppOriginStrategyConfig<LK> = defaultConfig as PartialNextAppOriginStrategyConfig<LK>
  ) {
    super(
      "plain",
      {
        ...defaultConfig,
        ...config,
      } as NextAppOriginStrategyConfig<LK>,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-origin.client-impl.js");
        return module.createNextAppOriginClientImpl(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-origin.server-impl-complement.js");
        return module.createNextAppOriginServerImplComplement(rMachine, strategyConfig);
      }
    );
  }
}

export function getOriginResolver(
  localeOrigins: LocaleOriginMap,
  rMachine: RMachine<AnyAtlas>
): (locale: string) => string {
  const map = new Map<string, string>();
  rMachine.config.locales.forEach((locale) => {
    const originOrOrigins = localeOrigins[locale];
    if (Array.isArray(originOrOrigins)) {
      map.set(locale, originOrOrigins[0]); // Use the first origin if multiple are provided
    } else {
      map.set(locale, originOrOrigins);
    }
  });
  return (locale: string) => map.get(locale)!;
}
