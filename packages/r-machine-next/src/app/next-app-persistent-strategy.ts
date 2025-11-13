import type { CookieDeclaration } from "r-machine/strategy";
import {
  NextAppStrategy,
  type NextAppStrategyConfig,
  type PartialNextAppPathStrategyConfig,
} from "./next-app-strategy.js";

type CookieOption = "off" | CookieDeclaration;
type PartialCookieOption = "off" | "on" | CookieDeclaration | undefined;

export interface NextAppPersistentStrategyConfig<LK extends string> extends NextAppStrategyConfig<LK> {
  readonly cookie: CookieOption;
}
export interface PartialNextAppPersistentStrategyConfig<LK extends string>
  extends PartialNextAppPathStrategyConfig<LK> {
  readonly cookie?: PartialCookieOption;
}

const defaultCookieDeclaration: CookieDeclaration = {
  name: "rm-locale",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export function getCookieOption(option: PartialCookieOption): CookieOption {
  let result: CookieOption;

  if (option === undefined || option === "off") {
    result = "off";
  } else if (option === "on") {
    result = defaultCookieDeclaration;
  } else {
    result = option;
  }

  return result;
}

export abstract class NextAppPersistentStrategy<
  LK extends string,
  C extends NextAppPersistentStrategyConfig<LK>,
> extends NextAppStrategy<LK, C> {}
