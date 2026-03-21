import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";

export abstract class Strategy<RA extends AnyResourceAtlas, L extends AnyLocale, FP extends AnyFmtProvider, C> {
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
