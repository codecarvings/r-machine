import type { RMachine } from "./index.js";
import type { AnyAtlas } from "./r.js";
import { RMachineError } from "./r-machine-error.js";

export type RMachineResolver<A extends AnyAtlas> = (token: string) => RMachine<A>;

export class RMachineResolverManager<A extends AnyAtlas> {
  constructor(
    protected readonly defaultRMachine: RMachine<A>,
    protected readonly resolver: RMachineResolver<A>
  ) {}

  protected cache = new Map<string, RMachine<A>>();

  protected resolveNewRMachine(token: string): RMachine<A> {
    const rMachine = this.resolver(token);
    if (!rMachine) {
      throw new RMachineError(`RMachine not found for the given token "${token}"`);
    }

    // TODO: validate that the resolved RMachine is compatible with the defaultRMachine

    return rMachine;
  }

  readonly resolveRMachine = (token: string | undefined): RMachine<A> => {
    if (token === undefined) {
      return this.defaultRMachine;
    }

    const resolvedRMachine = this.cache.get(token);
    if (resolvedRMachine !== undefined) {
      return resolvedRMachine;
    }

    const newResolvedRMachine = this.resolveNewRMachine(token);
    this.cache.set(token, newResolvedRMachine);
    return newResolvedRMachine;
  };

  static defaultRMachineResolver<A extends AnyAtlas>(token: string): RMachine<A> {
    throw new RMachineError(`RMachineResolver is not provided, cannot resolve RMachine for the given token "${token}"`);
  }
}
