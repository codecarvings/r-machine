import type { AnyAtlas } from "r-machine";
import { type CookieDeclaration, defaultCookieDeclaration } from "r-machine/strategy/web";
import type { AnyPathAtlas, HrefResolver, PathParamMap, PathParams, PathSelector } from "#r-machine/next/core";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "#r-machine/next/core/app";
import { defaultPathMatcher } from "#r-machine/next/internal";

// Locale not available for flat strategy since locale is stored in the cookie
interface HrefHelper<PA extends AnyPathAtlas> {
  readonly getPath: PathComposer<PA>;
}
type PathComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  path: P,
  params?: PathParams<P, O>
) => string;

export interface NextAppFlatStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends NextAppStrategyConfig<PA, LK> {
  readonly cookie: CookieDeclaration;
  readonly pathMatcher: RegExp | null;
}
export type AnyNextAppFlatStrategyConfig = NextAppFlatStrategyConfig<any, any>;
export interface PartialNextAppFlatStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends PartialNextAppStrategyConfig<PA, LK> {
  readonly cookie?: CookieDeclaration;
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppFlatStrategyConfig<
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  cookie: defaultCookieDeclaration,
  pathMatcher: defaultPathMatcher,
};

export abstract class NextAppFlatStrategyCore<
  A extends AnyAtlas,
  C extends AnyNextAppFlatStrategyConfig,
> extends NextAppStrategyCore<A, C> {
  static override readonly defaultConfig = defaultConfig;

  protected async createClientImpl() {
    const module = await import("./next-app-flat.client-impl.js");
    return module.createNextAppFlatClientImpl(this.rMachine, this.config, this.resolveHref);
  }

  protected async createServerImpl() {
    const module = await import("./next-app-flat.server-impl.js");
    return module.createNextAppFlatServerImpl(this.rMachine, this.config, this.resolveHref);
  }

  readonly hrefHelper: HrefHelper<InstanceType<C["PathAtlas"]>> = {
    getPath: (path, params) => this.resolveHref(true, undefined, path, params),
  };

  // TODO: Implement resolveHref
  protected readonly resolveHref: HrefResolver = undefined!;
}
