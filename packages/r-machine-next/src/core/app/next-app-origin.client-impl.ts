import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolverFn } from "#r-machine/next/core";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

export async function createNextAppOriginClientImpl(
  _rMachine: RMachine<AnyResourceAtlas>,
  _strategyConfig: AnyNextAppOriginStrategyConfig,
  resolvePath: HrefResolverFn,
  resolveUrl: HrefResolverFn
) {
  return {
    onLoad: undefined,

    writeLocale(newLocale, router) {
      const url = resolveUrl(newLocale, "/").href;
      router.push(url!);
    },

    createUsePathComposer: (useLocale) => {
      return () => {
        const locale = useLocale();

        return (path, params) => resolvePath(locale, path, params).href;
      };
    },
  } as NextAppClientImpl;
}
