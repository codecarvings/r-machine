import type { AnyAtlas, RMachine } from "r-machine";
import { Strategy } from "r-machine/strategy";

export type NextStrategyKind = "plain" | "path";

export abstract class NextStrategy<A extends AnyAtlas, SK extends NextStrategyKind, C> extends Strategy<A, C> {
  constructor(
    rMachine: RMachine<A>,
    protected readonly kind: SK,
    config: C
  ) {
    super(rMachine, config);
  }
}
