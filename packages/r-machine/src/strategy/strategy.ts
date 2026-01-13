import type { AnyResourceAtlas, RMachine } from "#r-machine";

export abstract class Strategy<RA extends AnyResourceAtlas, C> {
  constructor(
    readonly rMachine: RMachine<RA>,
    readonly config: C
  ) {
    this.validateConfig();
  }

  protected validateConfig(): void {
    // Default implementation does nothing
  }
}
