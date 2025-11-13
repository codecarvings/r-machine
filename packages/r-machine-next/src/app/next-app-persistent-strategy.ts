import type { CookieOption } from "r-machine/strategy";
import {
  NextAppStrategy,
  type NextAppStrategyConfig,
  type PartialNextAppPathStrategyConfig,
} from "./next-app-strategy.js";

export interface NextAppPersistentStrategyConfig<LK extends string> extends NextAppStrategyConfig<LK> {
  readonly cookie: CookieOption;
}
export interface PartialNextAppPersistentStrategyConfig<LK extends string>
  extends PartialNextAppPathStrategyConfig<LK> {
  readonly cookie?: CookieOption;
}

export abstract class NextAppPersistentStrategy<
  LK extends string,
  C extends NextAppPersistentStrategyConfig<LK>,
> extends NextAppStrategy<LK, C> {}
