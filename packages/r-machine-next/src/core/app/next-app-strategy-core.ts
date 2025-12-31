import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory, SwitchableOption } from "r-machine/strategy";
import type { PathAtlas } from "#r-machine/next/core";
import { type NextClientImpl, NextStrategyCore, type PartialNextStrategyCoreConfig } from "#r-machine/next/core";
import type { NextStrategyCoreConfig } from "../next-strategy-core.js";
import type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";

export const localeHeaderName = "x-rm-locale";

export type NextAppServerImplCoreKeys = "localeKey" | "autoLocaleBinding";
export type NextAppServerImplCore<PA extends PathAtlas, LK extends string> = Pick<
  NextAppServerImpl<PA, LK>,
  NextAppServerImplCoreKeys
>;
export type NextAppServerImplAddon<PA extends PathAtlas, LK extends string> = Omit<
  NextAppServerImpl<PA, LK>,
  NextAppServerImplCoreKeys
> & {
  [K in NextAppServerImplCoreKeys]?: NextAppServerImpl<PA, LK>[K];
};

export interface NextAppStrategyCoreConfig<PA extends PathAtlas, LK extends string> extends NextStrategyCoreConfig<PA> {
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export type AnyNextAppStrategyCoreConfig = NextAppStrategyCoreConfig<any, any>;
export interface PartialNextAppStrategyCoreConfig<PA extends PathAtlas, LK extends string>
  extends PartialNextStrategyCoreConfig<PA> {
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

const defaultLocaleKey = "locale" as const;

const defaultConfig: NextAppStrategyCoreConfig<
  typeof NextStrategyCore.defaultConfig.pathAtlas,
  typeof defaultLocaleKey
> = {
  ...NextStrategyCore.defaultConfig,
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
};

export abstract class NextAppStrategyCore<
  A extends AnyAtlas,
  C extends AnyNextAppStrategyCoreConfig,
> extends NextStrategyCore<A, C> {
  static override readonly defaultConfig = defaultConfig;

  constructor(
    rMachine: RMachine<A>,
    config: PartialNextAppStrategyCoreConfig<C["pathAtlas"], C["localeKey"]>,
    clientImplFactory: ImplFactory<NextClientImpl<C["pathAtlas"]>, C>,
    serverImplAddonFactory: ImplFactory<NextAppServerImplAddon<C["pathAtlas"], C["localeKey"]>, C>
  ) {
    super(
      rMachine,
      {
        ...defaultConfig,
        ...config,
      } as C,
      clientImplFactory
    );

    this.serverImplFactory = async (rMachine, strategyConfig) => {
      const module = await import("./next-app.server-impl-core.js");
      return {
        ...(await module.createNextAppServerImplCore(rMachine, strategyConfig)),
        ...(await serverImplAddonFactory(rMachine, strategyConfig)),
      };
    };
  }

  protected readonly serverImplFactory: ImplFactory<NextAppServerImpl<C["pathAtlas"], C["localeKey"]>, C>;

  protected readonly createServerToolset = async (): Promise<
    NextAppServerToolset<A, C["pathAtlas"], C["localeKey"]>
  > => {
    const { NextClientRMachine } = await this.getClientToolsetEnvelope();
    const impl = await this.serverImplFactory(this.rMachine, this.config);
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(this.rMachine, impl, NextClientRMachine);
  };
  protected getServerToolset(): Promise<NextAppServerToolset<A, C["pathAtlas"], C["localeKey"]>> {
    return this.getCached(this.createServerToolset);
  }
}
