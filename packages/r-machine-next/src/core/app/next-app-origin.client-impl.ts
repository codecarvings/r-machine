import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolver } from "#r-machine/next/core";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

export async function createNextAppOriginClientImpl(
  _rMachine: RMachine<AnyResourceAtlas>,
  _strategyConfig: AnyNextAppOriginStrategyConfig,
  resolveOrigin: (locale: string) => string,
  resolveHref: HrefResolver
) {
  return {
    onLoad: undefined,

    writeLocale(newLocale, router) {
      const href = resolveOrigin(newLocale);
      router.push(href!);
    },

    createUsePathComposer: (useLocale) => {
      return () => {
        const locale = useLocale();

        return (path, params) => {
          return resolveHref(true, locale, path, params);
        };
      };
    },
  } as NextAppClientImpl;
}
