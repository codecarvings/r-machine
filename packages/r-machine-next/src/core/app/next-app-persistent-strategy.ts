import type { ImplFactory } from "r-machine/strategy";
import type { CookieOption } from "r-machine/strategy/web";
import type { NextClientImpl } from "#r-machine/next/core";
import {
  type DefaultLocaleKey,
  type NextAppServerImplComplement,
  NextAppStrategy,
  type NextAppStrategyConfig,
  type PartialNextAppStrategyConfig,
} from "./next-app-strategy.js";

type ClientImplSubset = "setLocaleCookie";
export type NextAppPersistentClientImplSubset = Pick<NextClientImpl, ClientImplSubset>;
export type NextAppPersistentClientImplComplement = Omit<NextClientImpl, ClientImplSubset>;

export interface NextAppPersistentStrategyConfig<LK extends string> extends NextAppStrategyConfig<LK> {
  readonly cookie: CookieOption;
}
export interface PartialNextAppPersistentStrategyConfig<LK extends string> extends PartialNextAppStrategyConfig<LK> {
  readonly cookie?: CookieOption;
}

const defaultConfig: NextAppPersistentStrategyConfig<DefaultLocaleKey> = {
  ...NextAppStrategy.defaultConfig,
  cookie: "off",
};

export abstract class NextAppPersistentStrategy<
  LK extends string,
  C extends NextAppPersistentStrategyConfig<LK>,
> extends NextAppStrategy<LK, C> {
  static override readonly defaultConfig = defaultConfig;

  constructor(
    config: PartialNextAppPersistentStrategyConfig<LK>,
    clientImplComplementFactory: ImplFactory<NextAppPersistentClientImplComplement, C>,
    serverImplComplementFactory: ImplFactory<NextAppServerImplComplement<LK>, C>
  ) {
    super(
      {
        ...defaultConfig,
        ...config,
      } as C,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-persistent.client-impl-subset.js");
        return {
          ...(await module.createNextAppPersistentClientImplSubset(rMachine, strategyConfig)),
          ...(await clientImplComplementFactory(rMachine, strategyConfig)),
        };
      },
      serverImplComplementFactory
    );
  }
}
