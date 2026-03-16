import type { AnyLocale, AnyResourceAtlas, RMachine } from "#r-machine";

export abstract class Strategy<RA extends AnyResourceAtlas, L extends AnyLocale, C> {
  constructor(
    readonly rMachine: RMachine<RA, L>,
    readonly config: C
  ) {
    this.validateConfig();
  }

  protected validateConfig(): void {
    // Default implementation does nothing
  }
}
