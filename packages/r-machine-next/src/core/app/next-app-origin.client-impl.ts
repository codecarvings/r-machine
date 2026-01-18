import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolverFn } from "#r-machine/next/core";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

export async function createNextAppOriginClientImpl(
  _rMachine: RMachine<AnyResourceAtlas>,
  _strategyConfig: AnyNextAppOriginStrategyConfig,
  resolveOrigin: (locale: string) => string,
  resolvePath: HrefResolverFn
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

        return (path, params) => resolvePath(locale, path, params).href;
      };
    },
  } as NextAppClientImpl;
}
