import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolver } from "#r-machine/next/core";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

export async function createNextAppOriginClientImpl(
  _rMachine: RMachine<AnyResourceAtlas>,
  _strategyConfig: AnyNextAppOriginStrategyConfig,
  resolveOrigin: (locale: string) => string,
  _resolveHref: HrefResolver
) {
  return {
    onLoad: undefined,

    writeLocale(newLocale, router) {
      const href = resolveOrigin(newLocale);
      router.push(href!);
    },

    // TODO: Implement createUsePathComposer
    createUsePathComposer: undefined!,
  } as NextAppClientImpl;
}
