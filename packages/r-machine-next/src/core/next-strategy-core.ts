import type { AnyAtlas, RMachine } from "r-machine";
import { type ImplFactory, Strategy } from "r-machine/strategy";
import {
  createPathAtlas,
  type PathAtlas,
  type PathParamMap,
  type PathParams,
  type PathSelector,
} from "#r-machine/next";
import type { NextClientImpl, NextClientToolset, NextClientToolsetEnvelope } from "./next-client-toolset.js";

type PathComposer<PA extends PathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  locale: string,
  path: P,
  params?: PathParams<P, O>
) => string;
export type BoundPathComposer<PA extends PathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  path: P,
  params?: PathParams<P, O>
) => string;

interface PathHelper<PA extends PathAtlas> {
  readonly getPath: PathComposer<PA>;
}

export interface NextStrategyCoreConfig<PA extends PathAtlas> {
  readonly pathAtlas: PA;
}
type AnyNextStrategyCoreConfig = NextStrategyCoreConfig<any>;

export interface PartialNextStrategyCoreConfig<PA extends PathAtlas> {
  readonly pathAtlas?: PA;
}

const defaultPathAtlas = createPathAtlas({}, "DefaultPathAtlas");
type DefaultPathAtlas = typeof defaultPathAtlas;

const defaultConfig: NextStrategyCoreConfig<DefaultPathAtlas> = {
  pathAtlas: defaultPathAtlas,
};

export abstract class NextStrategyCore<A extends AnyAtlas, C extends AnyNextStrategyCoreConfig> extends Strategy<A, C> {
  static readonly defaultConfig = defaultConfig;

  constructor(
    rMachine: RMachine<A>,
    config: PartialNextStrategyCoreConfig<C["pathAtlas"]>,
    protected readonly clientImplFactory: ImplFactory<NextClientImpl<C["pathAtlas"]>, C>
  ) {
    super(rMachine, {
      ...defaultConfig,
      ...config,
    } as C);
  }

  abstract readonly pathHelper: PathHelper<C["pathAtlas"]>;

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
