import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolver, NextClientImpl } from "#r-machine/next/core";
import type { AnyNextAppOriginStrategyConfig } from "#r-machine/next/core/app";

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
  } as NextClientImpl;
}
