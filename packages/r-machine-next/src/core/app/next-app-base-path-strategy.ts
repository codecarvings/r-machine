import type { ImplFactory } from "r-machine/strategy";
import type { NextClientPathImpl } from "#r-machine/next/core";
import {
  NextAppBaseStrategy,
  type NextAppBaseStrategyConfig,
  type PartialNextAppBaseStrategyConfig,
  type ServerImplSubset,
} from "./next-app-base-strategy.js";
import { NextAppPathImplProvider } from "./next-app-path-impl-provider.js";
import type { NextAppServerPathImpl } from "./next-app-server-path-toolset.js";

export type NextAppServerPathImplComplement<LK extends string> = Omit<NextAppServerPathImpl<LK>, ServerImplSubset>;

export abstract class NextAppBasePathStrategy<
  LK extends string,
  C extends NextAppBaseStrategyConfig<LK>,
> extends NextAppPathImplProvider<LK, C> {
  static readonly defaultLocaleKey = NextAppBaseStrategy.defaultLocaleKey;
  static readonly defaultConfig = NextAppBaseStrategy.defaultConfig;

  constructor(
    config: PartialNextAppBaseStrategyConfig<LK>,
    clientImplFactory: ImplFactory<NextClientPathImpl, C>,
    serverImplComplementFactory: ImplFactory<NextAppServerPathImplComplement<LK>, C>
  ) {
    super(
      {
        ...NextAppBaseStrategy.defaultConfig,
        ...config,
      } as C,
      clientImplFactory,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app.server-impl-subset.js");
        return {
          ...(await module.createNextAppServerImplSubset(rMachine, strategyConfig)),
          ...(await serverImplComplementFactory(rMachine, strategyConfig)),
        } as NextAppServerPathImpl<LK>;
      }
    );
  }
}
