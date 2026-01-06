import type { AnyAtlas, RMachine } from "#r-machine";

export abstract class Strategy<A extends AnyAtlas, C> {
  constructor(
    readonly rMachine: RMachine<A>,
    readonly config: C
  ) {
    this.validateConfig();
  }

  protected validateConfig(): void {
    // Default implementation does nothing
  }
}
