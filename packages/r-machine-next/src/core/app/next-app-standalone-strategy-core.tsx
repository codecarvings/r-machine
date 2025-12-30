import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl, PathAtlas } from "#r-machine/next/core";
import type {
  NextAppStandaloneServerImpl,
  NextAppStandaloneServerToolset,
} from "./next-app-standalone-server-toolset.js";
import {
  NextAppStrategyCore,
  type NextAppStrategyCoreConfig,
  type PartialNextAppStrategyCoreConfig,
} from "./next-app-strategy-core.js";

export interface NextAppStandaloneStrategyCoreConfig<PA extends PathAtlas, LK extends string>
  extends NextAppStrategyCoreConfig<PA, LK> {}
export type AnyNextAppStandaloneStrategyCoreConfig = NextAppStandaloneStrategyCoreConfig<any, any>;
export interface PartialNextAppStandaloneStrategyCoreConfig<PA extends PathAtlas, LK extends string>
  extends PartialNextAppStrategyCoreConfig<PA, LK> {}

const defaultConfig: NextAppStandaloneStrategyCoreConfig<
  typeof NextAppStrategyCore.defaultConfig.pathAtlas,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
};

export abstract class NextAppStandaloneStrategyCore<
  A extends AnyAtlas,
  C extends AnyNextAppStandaloneStrategyCoreConfig,
> extends NextAppStrategyCore<A, C> {
  static override readonly defaultConfig = defaultConfig;

  constructor(
    rMachine: RMachine<A>,
    config: PartialNextAppStandaloneStrategyCoreConfig<C["pathAtlas"], C["localeKey"]>,
    clientImplFactory: ImplFactory<NextClientImpl<C["pathAtlas"]>, C>,
    protected override readonly serverImplFactory: ImplFactory<NextAppStandaloneServerImpl<C["pathAtlas"]>, C>
  ) {
    super(
      rMachine,
      {
        ...defaultConfig,
        ...config,
      } as C,
      clientImplFactory,
      serverImplFactory
    );
  }

  protected override readonly createServerToolset = async (): Promise<
    NextAppStandaloneServerToolset<A, C["pathAtlas"], C["localeKey"]>
  > => {
    const { NextClientRMachine } = await this.getClientToolsetEnvelope();
    const impl = await this.serverImplFactory(this.rMachine, this.config);
    const module = await import("./next-app-standalone-server-toolset.js");
    return module.createNextAppStandaloneServerToolset(this.rMachine, this.config, impl, NextClientRMachine);
  };
  protected override getServerToolset(): Promise<NextAppStandaloneServerToolset<A, C["pathAtlas"], C["localeKey"]>> {
    return this.getCached(this.createServerToolset);
  }
}
