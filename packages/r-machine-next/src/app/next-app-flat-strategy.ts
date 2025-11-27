import { type CookieDeclaration, defaultCookieDeclaration } from "r-machine/strategy/web";
import {
  type DefaultLocaleKey,
  NextAppBaseStrategy,
  type NextAppBaseStrategyConfig,
  type PartialNextAppBaseStrategyConfig,
} from "#r-machine/next/core/app";
import { defaultPathMatcher } from "../internal/matcher.js";

export interface NextAppFlatStrategyConfig<LK extends string> extends NextAppBaseStrategyConfig<LK> {
  readonly cookie: CookieDeclaration;
  readonly pathMatcher: RegExp | null;
}
export interface PartialNextAppFlatStrategyConfig<LK extends string> extends PartialNextAppBaseStrategyConfig<LK> {
  readonly cookie?: CookieDeclaration;
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppFlatStrategyConfig<DefaultLocaleKey> = {
  ...NextAppBaseStrategy.defaultConfig,
  cookie: defaultCookieDeclaration,
  pathMatcher: defaultPathMatcher,
};

export class NextAppFlatStrategy<LK extends string = DefaultLocaleKey> extends NextAppBaseStrategy<
  LK,
  NextAppFlatStrategyConfig<LK>
> {
  static override readonly defaultConfig = defaultConfig;

  constructor();
  constructor(config: PartialNextAppFlatStrategyConfig<LK>);
  constructor(config: PartialNextAppFlatStrategyConfig<LK> = {}) {
    super(
      {
        ...defaultConfig,
        ...config,
      } as NextAppFlatStrategyConfig<LK>,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-flat.client-impl.js");
        return module.createNextAppFlatClientImpl(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-flat.server-impl-complement.js");
        return module.createNextAppFlatServerImplComplement(rMachine, strategyConfig);
      }
    );
  }
}
