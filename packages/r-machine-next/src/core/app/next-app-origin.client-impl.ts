import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefTranslator } from "#r-machine/next/core";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

export async function createNextAppOriginClientImpl(
  _rMachine: RMachine<AnyResourceAtlas>,
  _strategyConfig: AnyNextAppOriginStrategyConfig,
  pathTranslator: HrefTranslator,
  urlTranslator: HrefTranslator
) {
  return {
    onLoad: undefined,

    writeLocale(newLocale, router) {
      const url = urlTranslator.get(newLocale, "/").value;
      router.push(url);
    },

    createUsePathComposer: (useLocale) => {
      return () => {
        const locale = useLocale();

        return (path, params) => pathTranslator.get(locale, path, params).value;
      };
    },
  } as NextAppClientImpl;
}
