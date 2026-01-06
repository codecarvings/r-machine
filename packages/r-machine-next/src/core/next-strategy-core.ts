import type { AnyAtlas, RMachine } from "r-machine";
import { Strategy } from "r-machine/strategy";
import type { HrefResolver } from "#r-machine/next/core";
import type { NextClientImpl, NextClientToolset } from "./next-client-toolset.js";
import type { AnyPathAtlas, PathAtlasCtor } from "./path-atlas.js";

export interface NextStrategyConfig<PA extends AnyPathAtlas> {
  readonly PathAtlas: PathAtlasCtor<PA>;
}
type AnyNextStrategyConfig = NextStrategyConfig<any>;
export interface PartialNextStrategyConfig<PA extends AnyPathAtlas> {
  readonly PathAtlas?: PathAtlasCtor<PA>;
}

// Need to export otherwise TS will expose the type as { decl: any; }
export class DefaultPathAtlas {
  readonly decl: any = {};
}
const defaultConfig: NextStrategyConfig<DefaultPathAtlas> = {
  PathAtlas: DefaultPathAtlas,
};

export abstract class NextStrategyCore<A extends AnyAtlas, C extends AnyNextStrategyConfig> extends Strategy<A, C> {
  static readonly defaultConfig = defaultConfig;

  constructor(rMachine: RMachine<A>, config: C) {
    super(rMachine, config as C);
    this.pathAtlas = new this.config.PathAtlas();
  }

  protected readonly pathAtlas: InstanceType<C["PathAtlas"]>;
  protected abstract readonly resolveHref: HrefResolver;

  protected abstract createClientImpl(): Promise<NextClientImpl>;

  async createClientToolset(): Promise<NextClientToolset<A, InstanceType<C["PathAtlas"]>>> {
    const impl = await this.createClientImpl();
    const module = await import("./next-client-toolset.js");
    return module.createNextClientToolset(this.rMachine, impl);
  }
}
