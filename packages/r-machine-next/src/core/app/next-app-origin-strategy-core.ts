import type { AnyAtlas } from "r-machine";
import type { AnyPathAtlas, HrefHelper } from "#r-machine/next/core";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "#r-machine/next/core/app";
import { defaultPathMatcher } from "#r-machine/next/internal";

export type LocaleOriginMap = {
  readonly [locale: string]: string | string[];
};

export interface NextAppOriginStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends NextAppStrategyConfig<PA, LK> {
  readonly localeOriginMap: LocaleOriginMap;
  readonly pathMatcher: RegExp | null;
}
export type AnyNextAppOriginStrategyConfig = NextAppOriginStrategyConfig<any, any>;
export interface PartialNextAppOriginStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends PartialNextAppStrategyConfig<PA, LK> {
  readonly localeOriginMap: LocaleOriginMap; // Required
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppOriginStrategyConfig<
  typeof NextAppStrategyCore.defaultConfig.pathAtlas,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  localeOriginMap: {},
  pathMatcher: defaultPathMatcher,
};

export abstract class NextAppOriginStrategyCore<
  A extends AnyAtlas,
  C extends AnyNextAppOriginStrategyConfig,
> extends NextAppStrategyCore<A, C> {
  static override readonly defaultConfig = defaultConfig;

  abstract readonly HrefHelper: HrefHelper<C["pathAtlas"]>;
}
