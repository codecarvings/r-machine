import type { AnyResourceAtlas, RMachine } from "r-machine";
import { Strategy, type SwitchableOption } from "r-machine/strategy";
import type { AnyPathAtlas, HrefResolver, PathAtlasCtor } from "#r-machine/next/core";
import type { NextAppClientImpl, NextAppClientRMachine, NextAppClientToolset } from "./next-app-client-toolset.js";
import type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";

export const localeHeaderName = "x-rm-locale";

export interface NextAppStrategyConfig<PA extends AnyPathAtlas, LK extends string> {
  readonly PathAtlas: PathAtlasCtor<PA>;
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export type AnyNextAppStrategyConfig = NextAppStrategyConfig<any, any>;
export interface PartialNextAppStrategyConfig<PA extends AnyPathAtlas, LK extends string> {
  readonly PathAtlas?: PathAtlasCtor<PA>;
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

// Need to export otherwise TS will expose the type as { decl: any; }
export class DefaultPathAtlas {
  readonly decl: any = {};
}
const defaultLocaleKey = "locale" as const;
const defaultConfig: NextAppStrategyConfig<DefaultPathAtlas, typeof defaultLocaleKey> = {
  PathAtlas: DefaultPathAtlas,
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
};

export abstract class NextAppStrategyCore<
  RA extends AnyResourceAtlas,
  C extends AnyNextAppStrategyConfig,
> extends Strategy<RA, C> {
  static readonly defaultConfig = defaultConfig;

  constructor(rMachine: RMachine<RA>, config: C) {
    super(rMachine, config as C);
    this.pathAtlas = new this.config.PathAtlas();
  }

  protected readonly pathAtlas: InstanceType<C["PathAtlas"]>;
  protected abstract readonly resolveHref: HrefResolver;

  protected abstract createClientImpl(): Promise<NextAppClientImpl>;
  protected abstract createServerImpl(): Promise<NextAppServerImpl>;

  async createClientToolset(): Promise<NextAppClientToolset<RA, InstanceType<C["PathAtlas"]>>> {
    const impl = await this.createClientImpl();
    const module = await import("./next-app-client-toolset.js");
    return module.createNextAppClientToolset(this.rMachine, impl);
  }

  async createServerToolset(
    NextClientRMachine: NextAppClientRMachine
  ): Promise<NextAppServerToolset<RA, InstanceType<C["PathAtlas"]>, C["localeKey"]>> {
    const impl = await this.createServerImpl();
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(this.rMachine, impl, NextClientRMachine);
  }
}
