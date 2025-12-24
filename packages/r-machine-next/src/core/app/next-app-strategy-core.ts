import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory, SwitchableOption } from "r-machine/strategy";
import { type NextClientImpl, NextStrategyCore } from "#r-machine/next/core";
import type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";

export const localeHeaderName = "x-rm-locale";

export interface NextAppStrategyCoreConfig<LK extends string> {
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export interface PartialNextAppStrategyCoreConfig<LK extends string> {
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

const defaultLocaleKey = "locale" as const;
export type DefaultLocaleKey = typeof defaultLocaleKey;

const defaultConfig: NextAppStrategyCoreConfig<DefaultLocaleKey> = {
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
};

export abstract class NextAppStrategyCore<
  A extends AnyAtlas,
  C extends NextAppStrategyCoreConfig<LK>,
  LK extends string,
> extends NextStrategyCore<A, C> {
  static readonly defaultLocaleKey = defaultConfig.localeKey;
  static readonly defaultConfig = defaultConfig;

  constructor(
    rMachine: RMachine<A>,
    config: PartialNextAppStrategyCoreConfig<LK>,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppServerImpl<LK>, C>
  ) {
    super(
      rMachine,
      {
        ...defaultConfig,
        ...config,
      } as C,
      clientImplFactory
    );
  }

  protected readonly createServerToolset = async (): Promise<NextAppServerToolset<A, LK>> => {
    const { NextClientRMachine } = await this.getClientToolsetEnvelope();
    const impl = await this.serverImplFactory(this.rMachine, this.config);
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(this.rMachine, impl, NextClientRMachine);
  };
  protected getServerToolset(): Promise<NextAppServerToolset<A, LK>> {
    return this.getCached(this.createServerToolset);
  }
}
