import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory, SwitchableOption } from "r-machine/strategy";
import {
  type AnyPathAtlas,
  type NextClientImpl,
  type NextStrategyConfig,
  NextStrategyCore,
  type PartialNextStrategyConfig,
} from "#r-machine/next/core";
import type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";

export const localeHeaderName = "x-rm-locale";

export interface NextAppStrategyConfig<PA extends AnyPathAtlas, LK extends string> extends NextStrategyConfig<PA> {
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export type AnyNextAppStrategyConfig = NextAppStrategyConfig<any, any>;
export interface PartialNextAppStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends PartialNextStrategyConfig<PA> {
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

const defaultLocaleKey = "locale" as const;
const defaultConfig: NextAppStrategyConfig<typeof NextStrategyCore.defaultConfig.pathAtlas, typeof defaultLocaleKey> = {
  ...NextStrategyCore.defaultConfig,
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
};

export abstract class NextAppStrategyCore<
  A extends AnyAtlas,
  C extends AnyNextAppStrategyConfig,
> extends NextStrategyCore<A, C> {
  static override readonly defaultConfig = defaultConfig;

  constructor(
    rMachine: RMachine<A>,
    config: C,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppServerImpl, C>
  ) {
    super(rMachine, config, clientImplFactory);
  }

  protected readonly createServerToolset = async (): Promise<
    NextAppServerToolset<A, C["pathAtlas"], C["localeKey"]>
  > => {
    const { NextClientRMachine } = await this.getClientToolsetEnvelope();
    const impl = await this.serverImplFactory(this.rMachine, this.config);
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(this.rMachine, impl, NextClientRMachine);
  };
  getServerToolset(): Promise<NextAppServerToolset<A, C["pathAtlas"], C["localeKey"]>> {
    return this.getCached(this.createServerToolset);
  }
}
