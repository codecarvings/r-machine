import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory, SwitchableOption } from "r-machine/strategy";
import type { CookieDeclaration } from "r-machine/strategy/web";
import type { AnyPathAtlas, NextClientImpl, NextClientRMachine, PathHelper } from "#r-machine/next/core";
import type { NextAppPathServerImpl, NextAppPathServerToolset } from "./next-app-path-server-toolset.js";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "./next-app-strategy-core.js";

interface CustomImplicitDefaultLocale {
  readonly pathMatcher: RegExp | null;
}
type ImplicitDefaultLocaleOption = SwitchableOption | CustomImplicitDefaultLocale;

interface CustomAutoDetectLocale {
  readonly pathMatcher: RegExp | null;
}
type AutoDetectLocaleOption = SwitchableOption | CustomAutoDetectLocale;
type CookieOption = SwitchableOption | CookieDeclaration;

export interface NextAppPathStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends NextAppStrategyConfig<PA, LK> {
  readonly cookie: CookieOption;
  readonly lowercaseLocale: SwitchableOption;
  readonly autoDetectLocale: AutoDetectLocaleOption;
  readonly implicitDefaultLocale: ImplicitDefaultLocaleOption;
}
export type AnyNextAppPathStrategyConfig = NextAppPathStrategyConfig<any, any>;
export interface PartialNextAppPathStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends PartialNextAppStrategyConfig<PA, LK> {
  readonly cookie?: CookieOption;
  readonly lowercaseLocale?: SwitchableOption;
  readonly autoDetectLocale?: AutoDetectLocaleOption;
  readonly implicitDefaultLocale?: ImplicitDefaultLocaleOption;
}

const defaultConfig: NextAppPathStrategyConfig<
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  cookie: "off",
  lowercaseLocale: "on",
  autoDetectLocale: "on",
  implicitDefaultLocale: "off",
};

export abstract class NextAppPathStrategyCore<
  A extends AnyAtlas,
  C extends AnyNextAppPathStrategyConfig,
> extends NextAppStrategyCore<A, C> {
  static override readonly defaultConfig = defaultConfig;

  // biome-ignore lint/complexity/noUselessConstructor: New type for serverImplFactory
  constructor(
    rMachine: RMachine<A>,
    config: C,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    serverImplFactory: ImplFactory<NextAppPathServerImpl, C>
  ) {
    super(rMachine, config, clientImplFactory, serverImplFactory);
  }

  // Initialized by the parent class constructor
  protected override readonly serverImplFactory!: ImplFactory<NextAppPathServerImpl, C>;

  override async createServerToolset(
    NextClientRMachine: NextClientRMachine
  ): Promise<NextAppPathServerToolset<A, InstanceType<C["PathAtlas"]>, C["localeKey"]>> {
    const impl = await this.serverImplFactory(this.rMachine, this.config);
    const module = await import("./next-app-path-server-toolset.js");
    return module.createNextAppPathServerToolset(this.rMachine, impl, NextClientRMachine);
  }

  abstract readonly pathHelper: PathHelper<InstanceType<C["PathAtlas"]>>;
}
