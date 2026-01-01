import type { AnyAtlas, RMachine } from "r-machine";
import {
  type AnyNextAppOriginStrategyConfig,
  type LocaleOriginMap,
  NextAppOriginStrategyCore,
  type PartialNextAppOriginStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppOriginStrategy<
  A extends AnyAtlas,
  C extends AnyNextAppOriginStrategyConfig,
> extends NextAppOriginStrategyCore<A, C> {
  // Config is required since localeOriginMap is required
  constructor(rMachine: RMachine<A>, config: PartialNextAppOriginStrategyConfig<C["pathAtlas"], C["localeKey"]>) {
    super(
      rMachine,
      {
        ...NextAppOriginStrategyCore.defaultConfig,
        ...config,
      } as C,
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
