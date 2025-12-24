import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory } from "r-machine/strategy";
import type {
  NextPathClientImpl,
  NextPathClientToolset,
  NextPathClientToolsetEnvelope,
} from "./next-path-client-toolset.js";
import { NextStrategyCore } from "./next-strategy-core.js";

type PathComposer = (locale: string, path: string) => string;
export type BoundPathComposer = (path: string) => string;

export interface PathHelper {
  readonly getPath: PathComposer;
}

export abstract class NextPathStrategyCore<A extends AnyAtlas, C> extends NextStrategyCore<A, C> {
  protected constructor(
    rMachine: RMachine<A>,
    config: C,
    protected override readonly clientImplFactory: ImplFactory<NextPathClientImpl, C>
  ) {
    super(rMachine, config, clientImplFactory);
  }

  abstract readonly pathHelper: PathHelper;

  protected override readonly createClientToolsetEnvelope = async (): Promise<NextPathClientToolsetEnvelope<A>> => {
    const impl = await this.clientImplFactory(this.rMachine, this.config);
    const module = await import("./next-path-client-toolset.js");
    return module.createNextPathClientToolsetEnvelope(this.rMachine, impl);
  };
  protected override getClientToolsetEnvelope(): Promise<NextPathClientToolsetEnvelope<A>> {
    return this.getCached(this.createClientToolsetEnvelope);
  }
  override async getClientToolset(): Promise<NextPathClientToolset<A>> {
    const envelope = await this.getClientToolsetEnvelope();
    return envelope.toolset;
  }
}
