import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolver } from "#r-machine/next/core";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

export async function createNextAppOriginClientImpl(
  rMachine: RMachine<AnyResourceAtlas>,
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
          let selectedLocale = locale;
          let explicit = false;
          if (params !== undefined) {
            const { paramLocale, ...otherParams } = params;
            if (paramLocale !== undefined) {
              // Override locale from params
              selectedLocale = paramLocale;
              rMachine.localeHelper.validateLocale(selectedLocale);
              explicit = true;
            }
            params = otherParams as any;
          }
          return resolveHref(explicit ? "bound-explicit" : "bound", selectedLocale, path, params);
        };
      };
    },
  } as NextAppClientImpl;
}
