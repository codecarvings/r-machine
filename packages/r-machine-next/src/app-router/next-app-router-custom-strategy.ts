import type { NextClientImpl, NextClientImplPackage } from "#r-machine/next/core";
import {
  type NextAppRouterServerImpl,
  type NextAppRouterServerImplPackage,
  NextAppRouterStrategy,
} from "#r-machine/next/core/app-router";
import { clientBinFactories, clientImpl } from "./next-app-router-custom-impl.client.js";
import { serverBinFactories, serverImpl } from "./next-app-router-custom-impl.server.js";

export type NextAppRouterCustomServerImpl<LK extends string> = NextAppRouterServerImpl<
  NextAppRouterCustomStrategyConfig<LK>
>;
export type NextAppRouterCustomClientImpl<LK extends string> = NextClientImpl<NextAppRouterCustomStrategyConfig<LK>>;
interface NextAppRouterCustomStrategyConfig<LK extends string> {
  readonly localeKey: LK;
  readonly basePath: string;
  readonly lowercaseLocale: boolean;
  readonly serverImpl: NextAppRouterCustomServerImpl<LK>;
  readonly clientImpl: NextAppRouterCustomClientImpl<LK>;
}

export type PartialNextAppRouterCustomServerImpl<LK extends string> = Partial<NextAppRouterCustomServerImpl<LK>>;
export type PartialNextAppRouterCustomClientImpl<LK extends string> = Partial<NextAppRouterCustomClientImpl<LK>>;
interface PartialNextAppRouterCustomStrategyConfig<LK extends string> {
  readonly localeKey: LK;
  readonly basePath?: string;
  readonly lowercaseLocale?: boolean;
  readonly serverImpl?: PartialNextAppRouterCustomServerImpl<LK>;
  readonly clientImpl?: PartialNextAppRouterCustomClientImpl<LK>;
}

const defaultConfig: NextAppRouterCustomStrategyConfig<string> = {
  localeKey: undefined!,
  basePath: "",
  lowercaseLocale: true,
  clientImpl: clientImpl,
  serverImpl: serverImpl,
};

export class NextAppRouterCustomStrategy<LK extends string> extends NextAppRouterStrategy<
  NextAppRouterCustomStrategyConfig<LK>,
  LK
> {
  constructor(config: PartialNextAppRouterCustomStrategyConfig<LK>) {
    super({
      ...defaultConfig,
      ...config,
      serverImpl: { ...defaultConfig.serverImpl, ...config.serverImpl },
      clientImpl: { ...defaultConfig.clientImpl, ...config.clientImpl },
    } as NextAppRouterCustomStrategyConfig<LK>);

    this.clientImplPackage = {
      impl: this.config.clientImpl,
      binFactories: clientBinFactories,
    };

    this.serverImplPackage = {
      impl: this.config.serverImpl,
      binFactories: serverBinFactories,
    };
  }

  protected readonly clientImplPackage: NextClientImplPackage<NextAppRouterCustomStrategyConfig<LK>>;
  protected getClientImplPackage() {
    return this.clientImplPackage;
  }

  protected readonly serverImplPackage: NextAppRouterServerImplPackage<NextAppRouterCustomStrategyConfig<LK>>;
  protected getServerImplPackage() {
    return this.serverImplPackage;
  }

  protected getLocaleKey(): LK {
    return this.config.localeKey;
  }
}
