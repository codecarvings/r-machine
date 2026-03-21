import type { AnyResourceAtlas, OptionalFmtProvider, RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";

export abstract class Strategy<RA extends AnyResourceAtlas, FP extends OptionalFmtProvider, L extends AnyLocale, C> {
  constructor(
    readonly rMachine: RMachine<RA, L, FP>,
    readonly config: C
  ) {
    this.validateConfig();
  }

  protected validateConfig(): void {
    // Default implementation does nothing
  }
}
