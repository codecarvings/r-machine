import { NextAppRouterStrategy } from "../next-app-router-strategy";
import type { NextAppRouterStrategyClientImpl } from "../next-app-router-strategy-client-impl";
import type { NextAppRouterStrategyServerImpl } from "../next-app-router-strategy-server-impl";
import { clientImpl } from "./next-app-router-custom-strategy-impl.client";
import { serverImpl } from "./next-app-router-custom-strategy-impl.server";

export type NextAppRouterCustomStrategyServerImpl<LK extends string> = NextAppRouterStrategyServerImpl<
  NextAppRouterCustomStrategyConfig<LK>
>;
export type NextAppRouterCustomStrategyClientImpl<LK extends string> = NextAppRouterStrategyClientImpl<
  NextAppRouterCustomStrategyConfig<LK>
>;
interface NextAppRouterCustomStrategyConfig<LK extends string> {
  readonly localeKey: LK;
  readonly basePath: string;
  readonly lowercaseLocale: boolean;
  readonly serverImpl: NextAppRouterCustomStrategyServerImpl<LK>;
  readonly clientImpl: NextAppRouterCustomStrategyClientImpl<LK>;
}

export type PartialNextAppRouterCustomStrategyServerImpl<LK extends string> = Partial<
  NextAppRouterCustomStrategyServerImpl<LK>
>;
export type PartialNextAppRouterCustomStrategyClientImpl<LK extends string> = Partial<
  NextAppRouterCustomStrategyClientImpl<LK>
>;
interface PartialNextAppRouterCustomStrategyConfig<LK extends string> {
  readonly localeKey: LK;
  readonly basePath?: string;
  readonly lowercaseLocale?: boolean;
  readonly serverImpl?: PartialNextAppRouterCustomStrategyServerImpl<LK>;
  readonly clientImpl?: PartialNextAppRouterCustomStrategyClientImpl<LK>;
}

const defaultConfig: NextAppRouterCustomStrategyConfig<string> = {
  localeKey: undefined!,
  basePath: "",
  lowercaseLocale: true,
  serverImpl: serverImpl,
  clientImpl: clientImpl,
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
  }

  protected getNextStrategyServerImpl(): NextAppRouterCustomStrategyServerImpl<LK> {
    return this.config.serverImpl;
  }

  protected getNextStrategyClientImpl(): NextAppRouterCustomStrategyClientImpl<LK> {
    return this.config.clientImpl;
  }

  protected getLocaleKey(): LK {
    return this.config.localeKey;
  }
}
