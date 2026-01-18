import type { AnyResourceAtlas, RMachine } from "r-machine";
import {
  type AnyPathAtlas,
  buildPathAtlas,
  HrefResolver,
  type HrefResolverAdapter,
  type PathParamMap,
  type PathParams,
  type PathSelector,
} from "#r-machine/next/core";
import { defaultPathMatcher } from "#r-machine/next/internal";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "./next-app-strategy-core.js";

interface HrefHelper<PA extends AnyPathAtlas> {
  readonly getPath: PathComposer<PA>;
  readonly getUrl: UrlComposer<PA>;
}
type PathComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  locale: string,
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
) => string;
type UrlComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  locale: string,
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
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

  constructor(rMachine: RMachine<RA>, config: C) {
    super(rMachine, config);
    rMachine.config.locales.forEach((locale) => {
      const originOrOrigins = config.localeOriginMap[locale];
      if (Array.isArray(originOrOrigins)) {
        this.localeOriginMap.set(locale, originOrOrigins[0]); // Use the first origin if multiple are provided
      } else {
        this.localeOriginMap.set(locale, originOrOrigins);
      }
    });
  }

  protected readonly pathAtlas = buildPathAtlas(this.config.PathAtlas, true);
  private readonly locales = this.rMachine.config.locales;
  private readonly defaultLocale = this.rMachine.config.defaultLocale;
  private readonly localeOriginMap = new Map<string, string>();
  protected readonly pathResolver: HrefResolver = new HrefResolver(
    this.pathAtlas,
    this.locales,
    this.defaultLocale,
    undefined
  );
  protected readonly urlResolverAdapter: HrefResolverAdapter = (locale: string, path: string): string => {
    return `${this.localeOriginMap.get(locale)}${path}`;
  };
  protected readonly urlResolver: HrefResolver = new HrefResolver(
    this.pathAtlas,
    this.locales,
    this.defaultLocale,
    this.urlResolverAdapter
  );

  protected async createClientImpl() {
    const module = await import("./next-app-origin.client-impl.js");
    return module.createNextAppOriginClientImpl(
      this.rMachine,
      this.config,
      this.pathResolver.getResolvedHref,
      this.urlResolver.getResolvedHref
    );
  }

  protected async createServerImpl() {
    const module = await import("./next-app-origin.server-impl.js");
    return module.createNextAppOriginServerImpl(
      this.rMachine,
      this.config,
      this.pathResolver.getResolvedHref,
      this.urlResolver.getResolvedHref
    );
  }

  readonly hrefHelper: HrefHelper<InstanceType<C["PathAtlas"]>> = {
    getPath: (locale, path, ...args) => this.pathResolver.getResolvedHref(locale, path, args[0]).href,
    getUrl: (locale, path, ...args) => this.urlResolver.getResolvedHref(locale, path, args[0]).href,
  };
}
