import type { ImplFactory, SwitchableOption } from "r-machine/strategy";
import type { NextClientImpl, NextStrategyKind } from "#r-machine/next/core";
import { NextAppImplProvider } from "./next-app-impl-provider.js";
import type { NextAppServerImpl } from "./next-app-server-toolset.js";

export const localeHeaderName = "x-rm-locale";

type ServerImplSubset = "localeKey" | "autoLocaleBinding";
export type NextAppServerImplSubset<LK extends string> = Pick<NextAppServerImpl<LK>, ServerImplSubset>;
export type NextAppServerImplComplement<LK extends string> = Omit<NextAppServerImpl<LK>, ServerImplSubset>;

export interface NextAppStrategyConfig<LK extends string> {
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export interface PartialNextAppStrategyConfig<LK extends string> {
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

const defaultLocaleKey = "locale" as const;
export type DefaultLocaleKey = typeof defaultLocaleKey;

const defaultConfig: NextAppStrategyConfig<DefaultLocaleKey> = {
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
};

export abstract class NextAppStrategy<
  SK extends NextStrategyKind,
  LK extends string,
  C extends NextAppStrategyConfig<LK>,
> extends NextAppImplProvider<SK, LK, C> {
  static readonly defaultLocaleKey = defaultLocaleKey;
  static readonly defaultConfig = defaultConfig;

  constructor(
    kind: SK,
    config: PartialNextAppStrategyConfig<LK>,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    serverImplComplementFactory: ImplFactory<NextAppServerImplComplement<LK>, C>
  ) {
    super(
      kind,
      {
        ...defaultConfig,
        ...config,
      } as C,
      clientImplFactory,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app.server-impl-subset.js");
        return {
          ...(await module.createNextAppServerImplSubset(rMachine, strategyConfig)),
          ...(await serverImplComplementFactory(rMachine, strategyConfig)),
        } as NextAppServerImpl<LK>;
      }
    );
  }
}
