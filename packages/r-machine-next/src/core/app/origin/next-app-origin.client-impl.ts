import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import type { NextAppClientImpl } from "../next-app-client-toolset.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

export async function createNextAppOriginClientImpl(
  _rMachine: RMachine<AnyResourceAtlas>,
  _strategyConfig: AnyNextAppOriginStrategyConfig,
  pathTranslator: HrefTranslator,
  urlTranslator: HrefTranslator,
  pathCanonicalizer: HrefCanonicalizer
) {
  return {
    onLoad: undefined,

    writeLocale(locale, newLocale, pathname, router) {
      if (newLocale === locale) {
        return;
      }

      const canonicalPath = pathCanonicalizer.get(locale, pathname);
      let url: string;
      if (canonicalPath.dynamic) {
        // If dynamic, translation of slugs is not available, redirect to root
        url = urlTranslator.get(newLocale, "/").value;
      } else {
        // Static path, surely no params
        url = urlTranslator.get(newLocale, canonicalPath.value).value;
      }
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
