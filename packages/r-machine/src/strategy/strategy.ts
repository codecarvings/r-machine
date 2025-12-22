import type { AnyAtlas, RMachine } from "#r-machine";

export abstract class Strategy<A extends AnyAtlas, C> {
  constructor(
    protected readonly rMachine: RMachine<A>,
    protected readonly config: C
  ) {}
}
