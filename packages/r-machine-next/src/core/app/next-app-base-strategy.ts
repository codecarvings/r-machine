import type { ImplFactory, SwitchableOption } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import { NextAppImplProvider } from "./next-app-impl-provider.js";
import type { NextAppServerImpl } from "./next-app-server-toolset.js";

export type ServerImplSubset = "localeKey" | "autoLocaleBinding";
export type NextAppServerImplSubset<LK extends string> = Pick<NextAppServerImpl<LK>, ServerImplSubset>;
export type NextAppServerImplComplement<LK extends string> = Omit<NextAppServerImpl<LK>, ServerImplSubset>;

export interface NextAppBaseStrategyConfig<LK extends string> {
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export interface PartialNextAppBaseStrategyConfig<LK extends string> {
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

const defaultLocaleKey = "locale" as const;
export type DefaultLocaleKey = typeof defaultLocaleKey;

const defaultConfig: NextAppBaseStrategyConfig<DefaultLocaleKey> = {
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
};

export abstract class NextAppBaseStrategy<
  LK extends string,
  C extends NextAppBaseStrategyConfig<LK>,
> extends NextAppImplProvider<LK, C> {
  static readonly defaultLocaleKey = defaultLocaleKey;
  static readonly defaultConfig = defaultConfig;

  constructor(
    config: PartialNextAppBaseStrategyConfig<LK>,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    serverImplComplementFactory: ImplFactory<NextAppServerImplComplement<LK>, C>
  ) {
    super(
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
