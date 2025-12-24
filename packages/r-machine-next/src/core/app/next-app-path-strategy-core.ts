import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory } from "r-machine/strategy";
import { type NextPathClientImpl, NextPathStrategyCore } from "#r-machine/next/core";
import type { NextAppPathServerImpl, NextAppPathServerToolset } from "./next-app-path-server-toolset.js";
import {
  type DefaultLocaleKey,
  NextAppStrategyCore,
  type NextAppStrategyCoreConfig,
  type PartialNextAppStrategyCoreConfig,
} from "./next-app-strategy-core.js";

export interface NextAppPathStrategyCoreConfig<LK extends string> extends NextAppStrategyCoreConfig<LK> {}
export interface PartialNextAppPathStrategyCoreConfig<LK extends string> extends PartialNextAppStrategyCoreConfig<LK> {}

const defaultConfig: NextAppPathStrategyCoreConfig<DefaultLocaleKey> = {
  ...NextAppStrategyCore.defaultConfig,
};

export abstract class NextAppPathStrategyCore<
  A extends AnyAtlas,
  C extends NextAppPathStrategyCoreConfig<LK>,
  LK extends string,
> extends NextPathStrategyCore<A, C> {
  static readonly defaultLocaleKey = defaultConfig.localeKey;
  static readonly defaultConfig = defaultConfig;

  constructor(
    rMachine: RMachine<A>,
    config: PartialNextAppPathStrategyCoreConfig<LK>,
    clientImplFactory: ImplFactory<NextPathClientImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppPathServerImpl<LK>, C>
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

  protected readonly createServerToolset = async (): Promise<NextAppPathServerToolset<A, LK>> => {
    const { NextClientRMachine } = await this.getClientToolsetEnvelope();
    const impl = await this.serverImplFactory(this.rMachine, this.config);
    const module = await import("./next-app-path-server-toolset.js");
    return module.createNextAppPathServerToolset(this.rMachine, impl, NextClientRMachine);
  };
  protected getServerToolset(): Promise<NextAppPathServerToolset<A, LK>> {
    return this.getCached(this.createServerToolset);
  }
}
