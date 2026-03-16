import type { AnyResourceAtlas, RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";

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
