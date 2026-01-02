import type { AnyAtlas, RMachine } from "r-machine";
import { type ImplFactory, Strategy } from "r-machine/strategy";
import type { NextClientImpl, NextClientToolset, NextClientToolsetEnvelope } from "./next-client-toolset.js";
import { type AnyPathAtlas, PathAtlas } from "./path-atlas.js";

export interface NextStrategyConfig<PA extends AnyPathAtlas> {
  readonly pathAtlas: PA;
}
type AnyNextStrategyConfig = NextStrategyConfig<any>;
export interface PartialNextStrategyConfig<PA extends AnyPathAtlas> {
  readonly pathAtlas?: PA;
}

export type UnknownPathAtlas = PathAtlas & {
  decl: any;
};
const defaultPathAtlas = new PathAtlas({});
const defaultConfig: NextStrategyConfig<UnknownPathAtlas> = {
  pathAtlas: defaultPathAtlas,
};

export abstract class NextStrategyCore<A extends AnyAtlas, C extends AnyNextStrategyConfig> extends Strategy<A, C> {
  static readonly defaultConfig = defaultConfig;

  constructor(
    rMachine: RMachine<A>,
    config: C,
    protected readonly clientImplFactory: ImplFactory<NextClientImpl, C>
  ) {
    super(rMachine, config as C);
  }

  protected readonly createClientToolsetEnvelope = async (): Promise<NextClientToolsetEnvelope<A, C["pathAtlas"]>> => {
    const impl = await this.clientImplFactory(this.rMachine, this.config);
    const module = await import("./next-client-toolset.js");
    return module.createNextClientToolsetEnvelope(this.rMachine, impl);
  };
  protected getClientToolsetEnvelope(): Promise<NextClientToolsetEnvelope<A, C["pathAtlas"]>> {
    return this.getCached(this.createClientToolsetEnvelope);
  }
  async getClientToolset(): Promise<NextClientToolset<A, C["pathAtlas"]>> {
    const envelope = await this.getClientToolsetEnvelope();
    return envelope.toolset;
  }
}
