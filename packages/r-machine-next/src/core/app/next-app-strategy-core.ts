import type { AnyAtlas } from "r-machine";
import type { SwitchableOption } from "r-machine/strategy";
import {
  type AnyPathAtlas,
  type NextClientRMachine,
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
const defaultConfig: NextAppStrategyConfig<
  InstanceType<typeof NextStrategyCore.defaultConfig.PathAtlas>,
  typeof defaultLocaleKey
> = {
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

  protected abstract createServerImpl(): Promise<NextAppServerImpl>;

  async createServerToolset(
    NextClientRMachine: NextClientRMachine
  ): Promise<NextAppServerToolset<A, InstanceType<C["PathAtlas"]>, C["localeKey"]>> {
    const impl = await this.createServerImpl();
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(this.rMachine, impl, NextClientRMachine);
  }
}
