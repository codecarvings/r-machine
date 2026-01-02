import type { AnyAtlas, RMachine } from "r-machine";
import type { AnyPathAtlas, HrefHelper } from "#r-machine/next/core";
import {
  type LocaleOriginMap,
  type NextAppOriginStrategyConfig,
  NextAppOriginStrategyCore,
  type PartialNextAppOriginStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppOriginStrategy<
  A extends AnyAtlas,
  PA extends AnyPathAtlas = (typeof NextAppOriginStrategyCore.defaultConfig)["pathAtlas"],
  LK extends string = (typeof NextAppOriginStrategyCore.defaultConfig)["localeKey"],
> extends NextAppOriginStrategyCore<A, NextAppOriginStrategyConfig<PA, LK>> {
  // Config is required since localeOriginMap is required
  constructor(rMachine: RMachine<A>, config: PartialNextAppOriginStrategyConfig<PA, LK>) {
    super(
      rMachine,
      {
        ...NextAppOriginStrategyCore.defaultConfig,
        ...config,
      } as NextAppOriginStrategyConfig<PA, LK>,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-origin.client-impl.js");
        return module.createNextAppOriginClientImpl(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-origin.server-impl.js");
        return module.createNextAppOriginServerImpl(rMachine, strategyConfig);
      }
    );
  }

  // TODO: Implement PathHelper
  readonly HrefHelper: HrefHelper<PA> = undefined!;
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
