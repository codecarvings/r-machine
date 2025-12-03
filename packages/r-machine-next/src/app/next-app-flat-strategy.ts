import { type CookieDeclaration, defaultCookieDeclaration } from "r-machine/strategy/web";
import {
  type DefaultLocaleKey,
  NextAppStrategy,
  type NextAppStrategyConfig,
  type PartialNextAppStrategyConfig,
} from "#r-machine/next/core/app";
import { defaultPathMatcher } from "#r-machine/next/internal";

export interface NextAppFlatStrategyConfig<LK extends string> extends NextAppStrategyConfig<LK> {
  readonly cookie: CookieDeclaration;
  readonly pathMatcher: RegExp | null;
}
export interface PartialNextAppFlatStrategyConfig<LK extends string> extends PartialNextAppStrategyConfig<LK> {
  readonly cookie?: CookieDeclaration;
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppFlatStrategyConfig<DefaultLocaleKey> = {
  ...NextAppStrategy.defaultConfig,
  cookie: defaultCookieDeclaration,
  pathMatcher: defaultPathMatcher,
};

export class NextAppFlatStrategy<LK extends string = DefaultLocaleKey> extends NextAppStrategy<
  "plain",
  LK,
  NextAppFlatStrategyConfig<LK>
> {
  static override readonly defaultConfig = defaultConfig;

  constructor();
  constructor(config: PartialNextAppFlatStrategyConfig<LK>);
  constructor(config: PartialNextAppFlatStrategyConfig<LK> = {}) {
    super(
      "plain",
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
