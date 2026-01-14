import type { AnyResourceAtlas } from "r-machine";
import type { AnyPathAtlas, HrefResolver, PathParamMap, PathParams, PathSelector } from "#r-machine/next/core";
import { defaultPathMatcher } from "#r-machine/next/internal";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "./next-app-strategy-core.js";

interface HrefHelper<PA extends AnyPathAtlas> {
  readonly getHref: HrefComposer<PA>;
  readonly getPath: PathComposer<PA>;
}
type HrefComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  locale: string,
  path: P,
  params?: PathParams<P, O>
) => string;
type PathComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  path: P,
  params?: PathParams<P, O>
) => string;

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
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  localeOriginMap: {},
  pathMatcher: defaultPathMatcher,
};

export abstract class NextAppOriginStrategyCore<
  RA extends AnyResourceAtlas,
  C extends AnyNextAppOriginStrategyConfig,
> extends NextAppStrategyCore<RA, C> {
  static override readonly defaultConfig = defaultConfig;

  protected async createClientImpl() {
    const module = await import("./next-app-origin.client-impl.js");
    return module.createNextAppOriginClientImpl(
      this.rMachine,
      this.config,
      getOriginResolver(this.config.localeOriginMap, this.rMachine.config.locales),
      this.resolveHref
    );
  }

  protected async createServerImpl() {
    const module = await import("./next-app-origin.server-impl.js");
    return module.createNextAppOriginServerImpl(
      this.rMachine,
      this.config,
      getOriginResolver(this.config.localeOriginMap, this.rMachine.config.locales),
      this.resolveHref
    );
  }

  readonly hrefHelper: HrefHelper<InstanceType<C["PathAtlas"]>> = {
    getHref: (locale, path, params) => this.resolveHref(true, locale, path, params),
    getPath: (path, params) => this.resolveHref(true, undefined, path, params),
  };

  // TODO: Implement resolveHref
  protected readonly resolveHref: HrefResolver = undefined!;
}

function getOriginResolver(localeOrigins: LocaleOriginMap, locales: readonly string[]): (locale: string) => string {
  const map = new Map<string, string>();
  locales.forEach((locale) => {
    const originOrOrigins = localeOrigins[locale];
    if (Array.isArray(originOrOrigins)) {
      map.set(locale, originOrOrigins[0]); // Use the first origin if multiple are provided
    } else {
      map.set(locale, originOrOrigins);
    }
  });
  return map.get.bind(map) as (locale: string) => string;
}
